"""
RealYieldAggregator Keeper Bot (自前版)

Gelato を使わない場合の自前 Keeper。
cron や systemd で定期実行する。

Usage:
    # 環境変数
    export ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
    export KEEPER_PRIVATE_KEY="0x..."
    export STRATEGY_ADDRESS="0x..."

    # 実行
    python keeper_bot.py

    # cron (6時間ごと)
    0 */6 * * * cd /path/to && python keeper_bot.py >> keeper.log 2>&1

機能:
    1. Strategy の状態チェック (needsRebalance, profitSinceLastHarvest)
    2. harvest() or tend() の実行判断
    3. ガス代 vs 利益の損益計算
    4. Discord/Telegram 通知
    5. 実行ログ (JSON)
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from dataclasses import dataclass

# NOTE: 実際の運用では web3 を使用
# from web3 import Web3
# from eth_account import Account


@dataclass
class StrategyState:
    """Strategy のオンチェーン状態"""
    total_assets: int        # 総資産 (USDC, 6 decimals)
    prev_assets: int         # 前回 harvest 時の資産
    last_harvest: int        # 前回 harvest の timestamp
    needs_rebalance: bool    # リバランス必要か
    latest_apy: int          # 直近 APY (bps)
    protocol_values: list    # [aave, sdai, sfrax, susde]
    current_bps: list        # 各プロトコルの配分比率


@dataclass
class HarvestDecision:
    """harvest 実行判断"""
    should_harvest: bool
    reason: str
    estimated_profit: int    # 推定利益 (USDC)
    estimated_gas: int       # 推定ガス代 (USDC)
    net_profit: int          # 純利益


class KeeperBot:
    """
    Keeper Bot メインクラス

    判断ロジック:
    1. needsRebalance == true → harvest
    2. lastHarvest から 7日以上 → harvest
    3. 利益 > ガス代 × 2 → harvest (ガスの2倍以上なら実行)
    4. それ以外 → skip
    """

    # Config
    MIN_PROFIT_USD = 100       # $100 以上で harvest
    MAX_HARVEST_DELAY = 7 * 24 * 3600  # 7 days
    GAS_MULTIPLIER = 2         # ガス代の2倍以上の利益で実行
    HARVEST_GAS_ESTIMATE = 500_000  # harvest のガス見積もり

    def __init__(self):
        self.rpc_url = os.environ.get("ETH_RPC_URL", "")
        self.private_key = os.environ.get("KEEPER_PRIVATE_KEY", "")
        self.strategy_address = os.environ.get("STRATEGY_ADDRESS", "")
        self.discord_webhook = os.environ.get("DISCORD_WEBHOOK", "")

        if not all([self.rpc_url, self.private_key, self.strategy_address]):
            print("ERROR: Missing env vars (ETH_RPC_URL, KEEPER_PRIVATE_KEY, STRATEGY_ADDRESS)")
            sys.exit(1)

    def get_state(self) -> StrategyState:
        """
        Strategy のオンチェーン状態を取得

        実装時:
            w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            contract = w3.eth.contract(address=self.strategy_address, abi=ABI)
            return StrategyState(
                total_assets=contract.functions.estimatedTotalAssets().call(),
                prev_assets=contract.functions.prevAssets().call(),
                last_harvest=contract.functions.lastHarvest().call(),
                needs_rebalance=contract.functions.needsRebalance().call(),
                latest_apy=contract.functions.latestApy().call(),
                protocol_values=contract.functions.protocolValues().call(),
                current_bps=contract.functions.currentBps().call(),
            )
        """
        # Placeholder for demo
        return StrategyState(
            total_assets=100_000_000_000,  # $100K
            prev_assets=99_500_000_000,    # $99.5K
            last_harvest=int(time.time()) - 3600,
            needs_rebalance=False,
            latest_apy=650,  # 6.5%
            protocol_values=[30_000_000_000, 30_000_000_000, 20_000_000_000, 20_000_000_000],
            current_bps=[3000, 3000, 2000, 2000],
        )

    def decide(self, state: StrategyState) -> HarvestDecision:
        """harvest すべきか判断"""

        now = int(time.time())
        profit = max(0, state.total_assets - state.prev_assets)
        profit_usd = profit / 1e6

        # Estimate gas cost in USD
        # NOTE: 実際は ETH 価格 × ガス量 × ガス単価
        estimated_gas_usd = 20  # ~$20 at 50 gwei, ETH $3K

        # Condition 1: Rebalance needed
        if state.needs_rebalance:
            return HarvestDecision(
                should_harvest=True,
                reason="REBALANCE_NEEDED",
                estimated_profit=profit,
                estimated_gas=int(estimated_gas_usd * 1e6),
                net_profit=profit - int(estimated_gas_usd * 1e6),
            )

        # Condition 2: Max delay exceeded
        time_since = now - state.last_harvest
        if state.last_harvest > 0 and time_since > self.MAX_HARVEST_DELAY:
            return HarvestDecision(
                should_harvest=True,
                reason=f"MAX_DELAY_EXCEEDED ({time_since // 3600}h > {self.MAX_HARVEST_DELAY // 3600}h)",
                estimated_profit=profit,
                estimated_gas=int(estimated_gas_usd * 1e6),
                net_profit=profit - int(estimated_gas_usd * 1e6),
            )

        # Condition 3: Profit exceeds threshold
        if profit_usd > self.MIN_PROFIT_USD and profit_usd > estimated_gas_usd * self.GAS_MULTIPLIER:
            return HarvestDecision(
                should_harvest=True,
                reason=f"PROFIT_THRESHOLD (${profit_usd:.2f} > ${estimated_gas_usd * self.GAS_MULTIPLIER:.2f})",
                estimated_profit=profit,
                estimated_gas=int(estimated_gas_usd * 1e6),
                net_profit=profit - int(estimated_gas_usd * 1e6),
            )

        # No harvest needed
        return HarvestDecision(
            should_harvest=False,
            reason=f"SKIP (profit=${profit_usd:.2f}, rebalance={state.needs_rebalance}, age={time_since // 3600}h)",
            estimated_profit=profit,
            estimated_gas=int(estimated_gas_usd * 1e6),
            net_profit=0,
        )

    def execute_harvest(self) -> str:
        """
        harvest() tx を送信

        実装時:
            w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            account = Account.from_key(self.private_key)
            contract = w3.eth.contract(address=self.strategy_address, abi=ABI)

            tx = contract.functions.harvestAndReport().build_transaction({
                'from': account.address,
                'nonce': w3.eth.get_transaction_count(account.address),
                'gas': self.HARVEST_GAS_ESTIMATE,
                'maxFeePerGas': w3.eth.gas_price * 2,
                'maxPriorityFeePerGas': w3.to_wei(2, 'gwei'),
            })

            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            return receipt['transactionHash'].hex()
        """
        return "0x_placeholder_tx_hash"

    def notify(self, message: str):
        """Discord webhook 通知"""
        if not self.discord_webhook:
            return

        # NOTE: 実際の実装
        # import requests
        # requests.post(self.discord_webhook, json={"content": message})
        print(f"[NOTIFY] {message}")

    def log_entry(self, state: StrategyState, decision: HarvestDecision, tx_hash: str = ""):
        """JSON ログ出力"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_assets_usdc": state.total_assets / 1e6,
            "apy_bps": state.latest_apy,
            "allocations": {
                "aave": state.current_bps[0],
                "sdai": state.current_bps[1],
                "sfrax": state.current_bps[2],
                "susde": state.current_bps[3],
            },
            "decision": decision.reason,
            "should_harvest": decision.should_harvest,
            "profit_usdc": decision.estimated_profit / 1e6,
            "gas_usdc": decision.estimated_gas / 1e6,
            "net_profit_usdc": decision.net_profit / 1e6,
            "tx_hash": tx_hash,
        }
        print(json.dumps(entry, indent=2))

    def run(self):
        """メインループ"""
        print(f"{'='*60}")
        print(f"  RealYield Keeper Bot")
        print(f"  Strategy: {self.strategy_address}")
        print(f"  Time: {datetime.now(timezone.utc).isoformat()}")
        print(f"{'='*60}")

        # 1. State check
        state = self.get_state()
        print(f"\n[STATE]")
        print(f"  Total Assets: ${state.total_assets / 1e6:,.2f}")
        print(f"  APY: {state.latest_apy / 100:.2f}%")
        print(f"  Needs Rebalance: {state.needs_rebalance}")
        print(f"  Allocations: Aave={state.current_bps[0]}  sDAI={state.current_bps[1]}  sFRAX={state.current_bps[2]}  sUSDe={state.current_bps[3]}")

        # 2. Decision
        decision = self.decide(state)
        print(f"\n[DECISION]")
        print(f"  {decision.reason}")
        print(f"  Harvest: {decision.should_harvest}")

        # 3. Execute if needed
        tx_hash = ""
        if decision.should_harvest:
            print(f"\n[EXECUTE] Sending harvest tx...")
            try:
                tx_hash = self.execute_harvest()
                print(f"  TX: {tx_hash}")
                self.notify(
                    f"🌾 Harvest executed\n"
                    f"Profit: ${decision.estimated_profit / 1e6:.2f}\n"
                    f"APY: {state.latest_apy / 100:.2f}%\n"
                    f"TX: {tx_hash}"
                )
            except Exception as e:
                print(f"  ERROR: {e}")
                self.notify(f"❌ Harvest failed: {e}")
        else:
            print(f"\n[SKIP] No harvest needed")

        # 4. Log
        self.log_entry(state, decision, tx_hash)


if __name__ == "__main__":
    bot = KeeperBot()
    bot.run()
