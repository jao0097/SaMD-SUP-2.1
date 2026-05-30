#!/usr/bin/env python3
"""
Avaliação RAG com RAGAS para o SUP.

Uso:
  python3 scripts/ragas_eval.py \
    --dataset eval_data/ragas_dataset_template.jsonl \
    --api-base http://localhost:8000 \
    --web-token "$WEB_TOKEN" \
    --out eval_data/ragas_result.json
"""

import argparse
import json
from pathlib import Path
from typing import Any

import httpx
from datasets import Dataset


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"JSON inválido em {path}:{line_no}: {exc}") from exc
    return rows


def _consultar(api_base: str, web_token: str, question: str, timeout_s: float) -> str:
    url = f"{api_base.rstrip('/')}/consultar"
    headers = {"Authorization": f"Bearer {web_token}"}
    payload = {"pergunta": question}
    with httpx.Client(timeout=timeout_s) as client:
        r = client.post(url, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()
    return str(data.get("resposta", "")).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="RAGAS eval para o SUP")
    parser.add_argument("--dataset", required=True, help="JSONL com question/ground_truth/contexts")
    parser.add_argument("--api-base", default="http://localhost:8000", help="Base URL da API")
    parser.add_argument("--web-token", required=True, help="Bearer token do SUP")
    parser.add_argument("--timeout-s", type=float, default=120.0)
    parser.add_argument("--out", default="eval_data/ragas_result.json")
    args = parser.parse_args()

    ds_path = Path(args.dataset)
    rows = _load_jsonl(ds_path)
    if not rows:
        raise SystemExit("Dataset vazio.")

    perguntas = []
    respostas = []
    gts = []
    contexts = []

    for row in rows:
        q = str(row.get("question", "")).strip()
        gt = str(row.get("ground_truth", "")).strip()
        ctx = row.get("contexts") or []
        if not q or not gt:
            raise SystemExit("Cada linha deve conter question e ground_truth.")
        if not isinstance(ctx, list):
            raise SystemExit("Campo contexts deve ser lista de strings.")

        ans = _consultar(args.api_base, args.web_token, q, args.timeout_s)
        perguntas.append(q)
        respostas.append(ans)
        gts.append(gt)
        contexts.append([str(x) for x in ctx])

    dataset = Dataset.from_dict(
        {
            "user_input": perguntas,
            "response": respostas,
            "reference": gts,
            "retrieved_contexts": contexts,
        }
    )

    try:
        from ragas import evaluate
        from ragas.metrics import (
            answer_relevancy,
            answer_correctness,
            context_precision,
            context_recall,
            faithfulness,
        )
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "RAGAS não disponível. Instale com: pip install -r requirements_ragas.txt"
        ) from exc

    result = evaluate(
        dataset=dataset,
        metrics=[
            answer_relevancy,
            answer_correctness,
            context_precision,
            context_recall,
            faithfulness,
        ],
        raise_exceptions=False,
    )

    out = {
        "summary": dict(result),
        "rows": [
            {
                "question": perguntas[i],
                "answer": respostas[i],
                "ground_truth": gts[i],
                "contexts_count": len(contexts[i]),
            }
            for i in range(len(perguntas))
        ],
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(out["summary"], ensure_ascii=False, indent=2))
    print(f"\nResultado salvo em: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
