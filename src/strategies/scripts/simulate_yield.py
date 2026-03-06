#!/usr/bin/env python3
"""
Yearn V3 Strategy Yield Simulator
=================================
3つの戦略の予想収益をシミュレーション。

レート前提（2025-2026 年の典型値）:
  - Aave V3 USDC Supply: 4.5%
  - Compound V3 USDC: 3.5% (supply) + 1.5% (COMP) = 5.0%
  - Curve 3pool: 2.0% (fees) + 5.0% (CRV) = 7.0%

Usage:
  python3 src/strategies/scripts/simulate_yield.py
"""

import sys
from dataclasses import dataclass
from typing import List

# ─── Configuration ───────────────────────────────────────────────

@dataclass
class Strategy:
    name: str
    base_apy: float       # 基本利回り (%)
    reward_apy: float     # 報酬利回り (%)
    harvest_gas: float    # 1回のharvest費用 ($)
    harvest_freq: int     # 年間harvest回数
    risk_score: int       # 1-5 (5が最高リスク)
    description: str

STRATEGIES = [
    Strategy(
        name="Aave V3 Lender",
        base_apy=4.5,
        reward_apy=0.0,
        harvest_gas=5.0,     # Aaveはharvest不要（利息自動）
        harvest_freq=12,     # 月1回の report のみ
        risk_score=1,
        description="Aave V3にUSDCを預入。aTokenの残高が自動増加。最もシンプル。",
    ),
    Strategy(
        name="Compound V3 Lender",
        base_apy=3.5,
        reward_apy=1.5,
        harvest_gas=25.0,    # claim + swap のガス代
        harvest_freq=52,     # 週1回harvest
        risk_score=2,
        description="Compound V3に貸出 + COMP報酬をUSDCにswapして再投資。",
    ),
    Strategy(
        name="Curve 3pool LP",
        base_apy=2.0,
        reward_apy=5.0,
        harvest_gas=40.0,    # claim + swap + add_liquidity + gauge.deposit
        harvest_freq=52,     # 週1回harvest
        risk_score=3,
        description="Curve 3poolにLP提供 + Gaugeステーク + CRV報酬を複利運用。",
    ),
]

DEPOSIT_AMOUNTS = [10_000, 50_000, 100_000, 500_000, 1_000_000]
SIMULATION_YEARS = 3

# ─── APY Scenarios ───────────────────────────────────────────────

@dataclass
class Scenario:
    name: str
    multiplier: float  # APY に掛ける係数

SCENARIOS = [
    Scenario("弱気 (Bear)", 0.5),
    Scenario("通常 (Base)", 1.0),
    Scenario("強気 (Bull)", 1.5),
]


# ─── Simulation Logic ───────────────────────────────────────────

def compound_yield(principal: float, apy: float, years: int,
                   compounds_per_year: int = 52) -> float:
    """複利計算 (週次複利)"""
    rate_per_period = apy / 100 / compounds_per_year
    periods = compounds_per_year * years
    return principal * (1 + rate_per_period) ** periods - principal


def simulate_strategy(strategy: Strategy, deposit: float, years: int,
                      scenario_mult: float = 1.0) -> dict:
    """単一戦略のシミュレーション"""
    total_apy = (strategy.base_apy + strategy.reward_apy) * scenario_mult

    # 複利での利益
    gross_profit = compound_yield(deposit, total_apy, years)

    # ガス代の控除
    total_gas = strategy.harvest_gas * strategy.harvest_freq * years

    net_profit = gross_profit - total_gas
    net_apy = ((deposit + net_profit) / deposit) ** (1/years) - 1 if years > 0 else 0

    return {
        "gross_apy": total_apy,
        "net_apy": net_apy * 100,
        "gross_profit": gross_profit,
        "gas_cost": total_gas,
        "net_profit": net_profit,
        "final_value": deposit + net_profit,
    }


def format_usd(amount: float) -> str:
    """$1,234,567 形式"""
    if amount >= 0:
        return f"${amount:,.0f}"
    return f"-${abs(amount):,.0f}"


def format_pct(pct: float) -> str:
    return f"{pct:.2f}%"


# ─── Output ──────────────────────────────────────────────────────

def print_header():
    print("=" * 80)
    print("  Yearn V3 Strategy Yield Simulator")
    print("  Quantum Shield - Personal Fund Management")
    print("=" * 80)
    print()


def print_strategy_overview():
    print("─── Strategy Overview ─────────────────────────────────────────────")
    print(f"{'#':<4} {'Strategy':<25} {'Base APY':>10} {'Reward APY':>12} {'Total APY':>10} {'Risk':>6}")
    print("─" * 80)
    for i, s in enumerate(STRATEGIES, 1):
        total = s.base_apy + s.reward_apy
        risk = "★" * s.risk_score + "☆" * (5 - s.risk_score)
        print(f"{i:<4} {s.name:<25} {s.base_apy:>9.1f}% {s.reward_apy:>11.1f}% {total:>9.1f}% {risk:>6}")
    print()


def print_yield_table():
    print("─── Yield Table (Base Scenario, Weekly Compound) ───────────────────")
    print()

    for strategy in STRATEGIES:
        total_apy = strategy.base_apy + strategy.reward_apy
        print(f"  📊 {strategy.name} (APY: {total_apy:.1f}%)")
        print(f"     {strategy.description}")
        print()
        print(f"  {'Deposit':>12} │ {'Monthly':>10} │ {'Yearly':>12} │ {'3-Year':>12} │ {'Gas/Year':>10} │ {'Net 3Y':>12}")
        print(f"  {'─'*12}─┼─{'─'*10}─┼─{'─'*12}─┼─{'─'*12}─┼─{'─'*10}─┼─{'─'*12}")

        for deposit in DEPOSIT_AMOUNTS:
            r1 = simulate_strategy(strategy, deposit, 1)
            r3 = simulate_strategy(strategy, deposit, 3)
            monthly = r1["net_profit"] / 12

            print(f"  {format_usd(deposit):>12} │ {format_usd(monthly):>10} │ "
                  f"{format_usd(r1['net_profit']):>12} │ {format_usd(r3['net_profit']):>12} │ "
                  f"{format_usd(r1['gas_cost']):>10} │ {format_usd(r3['net_profit']):>12}")

        print()


def print_scenario_comparison():
    print("─── Scenario Analysis ($100,000 deposit, 3 years) ─────────────────")
    print()

    deposit = 100_000
    years = 3

    header = f"  {'Strategy':<25}"
    for s in SCENARIOS:
        header += f" │ {s.name:>16}"
    print(header)
    print(f"  {'─'*25}" + "─┼─".join(["─" * 16] * len(SCENARIOS)))

    for strategy in STRATEGIES:
        row = f"  {strategy.name:<25}"
        for scenario in SCENARIOS:
            result = simulate_strategy(strategy, deposit, years, scenario.multiplier)
            row += f" │ {format_usd(result['net_profit']):>16}"
        print(row)

    print()

    # Net APY comparison
    print(f"  {'Net APY (after gas)':<25}", end="")
    print()
    for strategy in STRATEGIES:
        row = f"  {strategy.name:<25}"
        for scenario in SCENARIOS:
            result = simulate_strategy(strategy, deposit, years, scenario.multiplier)
            row += f" │ {format_pct(result['net_apy']):>16}"
        print(row)
    print()


def print_gas_analysis():
    print("─── Gas Cost Impact Analysis ──────────────────────────────────────")
    print()
    print("  ガス代が利益を食い潰す損益分岐点:")
    print()

    for strategy in STRATEGIES:
        total_apy = strategy.base_apy + strategy.reward_apy
        annual_gas = strategy.harvest_gas * strategy.harvest_freq
        # APY * deposit = gas → deposit = gas / APY
        if total_apy > 0:
            breakeven = annual_gas / (total_apy / 100)
            print(f"  {strategy.name:<25}: {format_usd(breakeven):>10} 以上で黒字")
            print(f"    (年間ガス代: {format_usd(annual_gas)}, harvest: {strategy.harvest_freq}回/年 × {format_usd(strategy.harvest_gas)}/回)")
        print()


def print_optimal_allocation():
    print("─── Optimal Allocation (Risk-Adjusted) ────────────────────────────")
    print()

    allocations = [
        ("保守型 (Risk 1)", [80, 20, 0]),
        ("バランス型 (Risk 2)", [40, 30, 30]),
        ("積極型 (Risk 3)", [20, 20, 60]),
    ]

    deposit = 100_000
    years = 1

    for alloc_name, weights in allocations:
        total_profit = 0
        total_gas = 0
        print(f"  🎯 {alloc_name}")

        for i, (strategy, weight) in enumerate(zip(STRATEGIES, weights)):
            amount = deposit * weight / 100
            if amount > 0:
                result = simulate_strategy(strategy, amount, years)
                total_profit += result["net_profit"]
                total_gas += result["gas_cost"]
                print(f"     {strategy.name:<25}: {weight:>3}% ({format_usd(amount):>10}) → {format_usd(result['net_profit']):>8}/年")

        blended_apy = total_profit / deposit * 100
        print(f"     {'合計':<25}: 100% ({format_usd(deposit):>10}) → {format_usd(total_profit):>8}/年 (APY: {format_pct(blended_apy)})")
        print()


def print_monthly_cashflow():
    print("─── Monthly Cash Flow ($100,000, Base Scenario) ───────────────────")
    print()

    deposit = 100_000

    print(f"  {'Month':>6}", end="")
    for s in STRATEGIES:
        print(f" │ {s.name:>22}", end="")
    print()
    print(f"  {'─'*6}" + "─┼─".join(["─" * 22] * len(STRATEGIES)))

    for month in range(1, 13):
        row = f"  {month:>6}"
        for strategy in STRATEGIES:
            total_apy = strategy.base_apy + strategy.reward_apy
            # 月次複利
            monthly_rate = total_apy / 100 / 12
            cumulative = deposit * ((1 + monthly_rate) ** month - 1)
            gas_so_far = strategy.harvest_gas * strategy.harvest_freq * month / 12
            net = cumulative - gas_so_far
            row += f" │ {format_usd(net):>22}"
        print(row)
    print()


def main():
    print_header()
    print_strategy_overview()
    print_yield_table()
    print_scenario_comparison()
    print_gas_analysis()
    print_optimal_allocation()
    print_monthly_cashflow()

    print("=" * 80)
    print("  ⚠️  Disclaimer")
    print("  - 上記はシミュレーションであり、実際の利回りは市場状況により変動します")
    print("  - DeFi プロトコルにはスマートコントラクトリスクがあります")
    print("  - ガス代は Ethereum mainnet の平均値を使用（L2 なら大幅に安い）")
    print("  - COMP/CRV の報酬 APY はトークン価格と emission rate に依存します")
    print("  - harvest 頻度は最適化の余地があります（大口ほど頻繁が有利）")
    print("=" * 80)


if __name__ == "__main__":
    main()
