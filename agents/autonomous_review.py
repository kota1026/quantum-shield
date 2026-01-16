#!/usr/bin/env python3
"""
Quantum Shield Bridge - 自律型プロジェクト運営システム
プロジェクトフォルダを読み込み、理念に照らして点検します。
"""

import os
import sys
from pathlib import Path
from typing import Dict
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

DEFAULT_PROJECT_ROOT = "/Users/kotakato/pqc_zk/zk-dilithium-ntt"

IMPORTANT_DOCS = [
    "TECHNICAL_SPEC.md", "FINAL_REPORT.md", "FINAL_REPORT_JA.md",
    "INTERNAL_REPORT.md", "INTERNAL_REPORT_JA.md", "README.md",
]

IGNORE_DIRS = ["target", "lib", "node_modules", "out", ".git", "cache", "agents"]

PURPOSE_DOCUMENT = """
# Quantum Shield Bridge - 理念 (PURPOSE)

## Vision
量子コンピューター時代にも、ブロックチェーン上にある資産を、
人々がみんな **安く、早く、便利に、安心して** 使える世界。

## 技術原則（絶対不変）
1. NIST認証暗号のみを使用
2. FIPS 204（ML-DSA/Dilithium）に完全準拠
3. 形式検証に耐えられる構造
4. 完全量子耐性（最終製品において）
5. テスト・コードでズルをしない

## 目標値
- 証明生成時間：10秒以内
- L1検証ガスコスト：1000gas/sig以下（償却後）
- MacBook Air M3で動作
"""

class LiveProjectScanner:
    def __init__(self, project_root: str = None):
        self.root = Path(project_root or DEFAULT_PROJECT_ROOT)
        if not self.root.exists():
            raise FileNotFoundError(f"プロジェクトフォルダが見つかりません: {self.root}")
        print(f"📁 プロジェクトルート: {self.root}")

    def scan_documents(self) -> Dict[str, str]:
        print("\n📄 ドキュメントをスキャン中...")
        docs = {}
        for doc_name in IMPORTANT_DOCS:
            doc_path = self.root / doc_name
            if doc_path.exists():
                try:
                    content = doc_path.read_text(encoding='utf-8')
                    docs[doc_name] = content
                    print(f"   ✅ {doc_name} ({len(content):,} bytes)")
                except Exception as e:
                    print(f"   ⚠️ {doc_name} 読み込み失敗: {e}")
        return docs

    def scan_structure(self) -> Dict:
        print("\n📂 プロジェクト構造をスキャン中...")
        structure = {"directories": [], "rust_files": [], "solidity_files": [], "total_rust_lines": 0, "total_sol_lines": 0}
        
        for item in self.root.iterdir():
            if item.is_dir() and item.name not in IGNORE_DIRS and not item.name.startswith('.'):
                structure["directories"].append(item.name)
        
        for f in self.root.rglob("*.rs"):
            if not any(ignore in str(f) for ignore in IGNORE_DIRS):
                try:
                    lines = len(f.read_text(encoding='utf-8').splitlines())
                    structure["rust_files"].append({"path": str(f.relative_to(self.root)), "lines": lines})
                    structure["total_rust_lines"] += lines
                except: pass
        
        for f in self.root.rglob("*.sol"):
            if not any(ignore in str(f) for ignore in IGNORE_DIRS):
                try:
                    lines = len(f.read_text(encoding='utf-8').splitlines())
                    structure["solidity_files"].append({"path": str(f.relative_to(self.root)), "lines": lines})
                    structure["total_sol_lines"] += lines
                except: pass
        
        print(f"   ディレクトリ: {len(structure['directories'])}個")
        print(f"   Rustファイル: {len(structure['rust_files'])}個 ({structure['total_rust_lines']:,}行)")
        print(f"   Solidityファイル: {len(structure['solidity_files'])}個 ({structure['total_sol_lines']:,}行)")
        return structure

class PurposeGuardianAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=4000)

    def review(self, docs: Dict[str, str], structure: Dict) -> str:
        docs_content = ""
        for name, content in list(docs.items())[:5]:
            docs_content += f"\n### {name}\n```\n{content[:3000]}\n```\n"
        
        prompt = f"""
あなたはQuantum Shield Bridgeの**Purpose Guardian（理念の番人）**です。

## 理念
{PURPOSE_DOCUMENT}

## プロジェクト状況
- ディレクトリ: {', '.join(structure.get('directories', []))}
- Rustファイル: {len(structure.get('rust_files', []))}個 ({structure.get('total_rust_lines', 0):,}行)
- Solidityファイル: {len(structure.get('solidity_files', []))}個 ({structure.get('total_sol_lines', 0):,}行)

## ドキュメント
{docs_content[:12000]}

## 点検タスク
理念に照らして厳格に点検し、以下の形式で報告してください：

### 1. 理念整合性チェック
- 信頼（100年後も守れるか）: ○/△/× と根拠
- 価値（安く・早く・便利）: ○/△/× と根拠
- 真剣（考え抜いた結果か）: ○/△/× と根拠

### 2. 技術原則チェック（各項目 ○/△/×）
- NIST認証暗号 / FIPS 204準拠 / 形式検証耐性 / 完全量子耐性 / ズルなし

### 3. 目標達成度
- 証明時間10秒以内 / ガス1000gas/sig以下 / MacBook M3動作

### 4. 発見された課題
- 🔴 重大 / 🟡 注意 / 🟢 良好

### 5. 推奨アクション（優先順位順）

### 6. 総合評価（A/B/C/D/F と次フェーズ準備状況）
"""
        response = self.llm.invoke([
            SystemMessage(content="あなたはQuantum Shield Bridgeの理念の番人です。厳格に点検してください。"),
            HumanMessage(content=prompt)
        ])
        return response.content

class CTOAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=3000)

    def analyze(self, guardian_review: str, structure: Dict) -> str:
        prompt = f"""
あなたはQuantum Shield Bridgeの**CTO**です。

## Purpose Guardian点検結果
{guardian_review}

## プロジェクト規模
- Rust: {structure.get('total_rust_lines', 0):,}行
- Solidity: {structure.get('total_sol_lines', 0):,}行

## タスク
技術責任者として分析し、以下を報告：
1. 技術的評価（量子耐性・パフォーマンス・コード品質）
2. 技術的課題と解決策（優先度・工数見積）
3. 今週の技術タスク
4. CEO承認が必要な技術判断
"""
        response = self.llm.invoke([
            SystemMessage(content="あなたはCTOです。技術的に深く分析してください。"),
            HumanMessage(content=prompt)
        ])
        return response.content

class CBOAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=3000)

    def analyze(self, guardian_review: str, cto_analysis: str) -> str:
        prompt = f"""
あなたはQuantum Shield Bridgeの**CBO（事業開発責任者）**です。

## Purpose Guardian点検結果
{guardian_review}

## CTO技術分析
{cto_analysis}

## タスク
事業開発責任者として分析し、以下を報告：
1. 製品の市場投入可否（Ready/Not Ready）
2. パイロット顧客候補（優先度・アプローチ方法）
3. 今週の営業アクション
4. CEO承認が必要な事項
"""
        response = self.llm.invoke([
            SystemMessage(content="あなたはCBOです。事業開発の観点から分析してください。"),
            HumanMessage(content=prompt)
        ])
        return response.content

def main():
    print("\n" + "="*60)
    print("🛡️ Quantum Shield Bridge - 自律点検システム")
    print("="*60 + "\n")

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY が設定されていません")
        print("   export ANTHROPIC_API_KEY='your-key'")
        sys.exit(1)

    project_root = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PROJECT_ROOT
    
    try:
        scanner = LiveProjectScanner(project_root)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)

    docs = scanner.scan_documents()
    structure = scanner.scan_structure()

    if not docs:
        print("\n⚠️ ドキュメントが見つかりません")
        sys.exit(1)

    print("\n" + "="*60)
    print("🛡️ Purpose Guardian による点検")
    print("="*60 + "\n")
    guardian = PurposeGuardianAgent()
    guardian_review = guardian.review(docs, structure)
    print(guardian_review)

    print("\n" + "="*60)
    print("🔧 CTO による技術分析")
    print("="*60 + "\n")
    cto = CTOAgent()
    cto_analysis = cto.analyze(guardian_review, structure)
    print(cto_analysis)

    print("\n" + "="*60)
    print("💼 CBO による事業分析")
    print("="*60 + "\n")
    cbo = CBOAgent()
    cbo_analysis = cbo.analyze(guardian_review, cto_analysis)
    print(cbo_analysis)

    # レポート保存
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    report_path = logs_dir / f"{timestamp}_review.md"
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# 自律点検レポート - {timestamp}\n\n")
        f.write("## Purpose Guardian\n" + guardian_review + "\n\n")
        f.write("## CTO分析\n" + cto_analysis + "\n\n")
        f.write("## CBO分析\n" + cbo_analysis)
    
    print(f"\n📄 レポート保存: {report_path}")
    print("\n" + "="*60)
    print("✅ 点検完了！CEOが確認して次のアクションを承認してください。")
    print("="*60)

if __name__ == "__main__":
    main()
