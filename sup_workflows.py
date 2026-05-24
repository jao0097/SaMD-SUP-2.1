import concurrent.futures
import json
import os
import time
from datetime import date
from typing import Dict, List, Optional, Set
from urllib.parse import urlparse


def pipeline_gerar_json_para_txts_sem_json(
    app,
    *,
    pasta: Optional[str] = None,
    sobrescrever_json: bool = False,
) -> None:
    alvo = os.path.abspath(pasta or app.PASTA_SAIDA)
    if not os.path.isdir(alvo):
        print(f"Pasta não encontrada: {alvo}")
        return
    nomes = sorted(a for a in os.listdir(alvo) if a.endswith(".txt"))
    if not nomes:
        print(f"Nenhum .txt em: {alvo}")
        return

    candidatos: List[str] = []
    cru_sem_par = 0
    fmt_sem_par = 0
    for nome in nomes:
        info = app.inspecionar_txt_local(os.path.join(alvo, nome))
        if not info or info["tem_json"]:
            continue
        candidatos.append(nome)
        if info["texto_cru_sem_par"]:
            cru_sem_par += 1
        elif info["formatado_sem_par"]:
            fmt_sem_par += 1

    print(f"\n📋 Pasta: {alvo}")
    print(f"   • .txt sem .json (a preparar): {len(candidatos)}")
    print(f"      — texto cru (sem cabeçalho Dr. Ajuda): {cru_sem_par}")
    print(f"      — já formatado, só falta o .json: {fmt_sem_par}")
    if not candidatos:
        print("\n✓ Nada a preparar (todos os .txt já têm .json ou pasta vazia).")
        return

    criados = 0
    for nome in candidatos:
        base = nome[:-4]
        caminho_txt = os.path.join(alvo, nome)
        info = app.inspecionar_txt_local(caminho_txt)
        rotulo = "texto cru" if info and info["texto_cru_sem_par"] else "só faltava JSON"
        if app.preparar_txt_sem_par_como_fonte_indexavel(
            caminho_txt, sobrescrever_json=sobrescrever_json
        ):
            criados += 1
            print(f"  ✅ Preparado ({rotulo}): {base}.json + .txt padronizado")
        else:
            print(f"  ⚠️  Falhou ou conteúdo vazio: {nome}")

    print(f"\n📎 Preparados com sucesso: {criados}/{len(candidatos)}")
    if not app.GROQ_ENABLED:
        print("\n  ⚠️  Sem GROQ_API_KEY os metadados usam só fallback curto (como nos outros fluxos quando a IA falha).")


def pipeline_processar_pasta(app) -> None:
    app._ensure_db()
    if not os.path.exists(app.PASTA_SAIDA):
        print(f"Pasta não encontrada: {app.PASTA_SAIDA}")
        return
    txts = [a for a in os.listdir(app.PASTA_SAIDA) if a.endswith(".txt")]
    if not txts:
        print("Nenhum .txt encontrado na pasta.")
        return

    print(f"\n📂 {len(txts)} arquivo(s) encontrado(s)\n{'─'*50}")
    processadas_set = app.carregar_processadas()
    for nome_txt in txts:
        nome_base = nome_txt[:-4]
        caminho_txt = os.path.join(app.PASTA_SAIDA, nome_txt)
        caminho_json = os.path.join(app.PASTA_SAIDA, f"{nome_base}.json")

        if not os.path.exists(caminho_json):
            print(f"⚠️  JSON não encontrado para: {nome_txt} — gerando automaticamente...")
            ok = app.preparar_txt_sem_par_como_fonte_indexavel(caminho_txt)
            if not ok:
                print(f"   ❌ Não foi possível gerar o JSON para: {nome_txt} — pulando.")
                continue
            print(f"   ✅ JSON gerado: {nome_base}.json")

        try:
            with open(caminho_json, encoding="utf-8") as f:
                meta = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"⚠️  JSON inválido ({caminho_json}): {e} — pulando")
            continue

        if meta.get("indexado_chroma") is True:
            print(f"⏭️  Já indexado: {meta.get('titulo', nome_base)}")
            continue

        titulo = meta.get("titulo", nome_base)
        tipo = meta.get("tipo", "video_youtube")
        print(f"\n🎬 Processando: {titulo}")

        with open(caminho_txt, encoding="utf-8") as f:
            texto_bruto = f.read()
        corpo_arquivo, _ = app.extrair_corpo_txt_local_bruto(texto_bruto, nome_txt)
        texto_limpo = app.limpar_transcricao(corpo_arquivo)
        with open(caminho_txt, "w", encoding="utf-8") as f:
            f.write(texto_limpo if texto_limpo.endswith("\n") else texto_limpo + "\n")

        meta_ia = app.gerar_metadados(titulo, texto_limpo, tipo)
        extra = {k: v for k, v in meta.items() if k in ("canal", "dominio", "duracao", "video_id")}
        n = app.indexar_conteudo(
            conteudo=texto_limpo,
            titulo=titulo,
            url=meta.get("url", ""),
            tipo=tipo,
            meta_extra=extra,
            meta_ia=meta_ia,
        )
        meta.update(meta_ia)
        meta["indexado_chroma"] = True
        with open(caminho_json, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        url_meta = meta.get("url", "")
        if url_meta:
            app.marcar_processada(url_meta, processadas_set)
        print(f"  ✅ {titulo} — {n} chunks indexados")

    print(f"\n🏁 Concluído! Total de chunks no banco: {app.colecao.count()}")
    app.salvar_catalogo()


def relatorio_pasta(app, pasta: Optional[str] = None) -> None:
    alvo = os.path.abspath(pasta or app.PASTA_SAIDA)
    if not os.path.isdir(alvo):
        print(f"❌ Pasta não encontrada: {alvo}")
        return

    todos_txts = sorted(a for a in os.listdir(alvo) if a.endswith(".txt") and not a.startswith("_"))
    jsons_existentes = {
        os.path.splitext(a)[0] for a in os.listdir(alvo) if a.endswith(".json") and not a.startswith("_")
    }
    com_json: List[str] = []
    sem_json: List[str] = []
    for nome in todos_txts:
        (com_json if nome[:-4] in jsons_existentes else sem_json).append(nome)

    ja_indexados: List[str] = []
    pendentes: List[str] = []
    for nome in com_json:
        caminho_json = os.path.join(alvo, f"{nome[:-4]}.json")
        try:
            with open(caminho_json, encoding="utf-8") as f:
                meta = json.load(f)
            if meta.get("indexado_chroma"):
                ja_indexados.append(nome)
            else:
                pendentes.append(nome)
        except (json.JSONDecodeError, OSError):
            pendentes.append(nome)

    print(f"\n{'═'*62}")
    print(f"  📂 RELATÓRIO DA PASTA: {alvo}")
    print(f"{'═'*62}")
    print(f"  Total de .txt encontrados   : {len(todos_txts)}")
    print(f"  ✅ Já indexados no Chroma   : {len(ja_indexados)}")
    print(f"  ⏳ Com JSON, aguardando     : {len(pendentes)}")
    print(f"  ❌ Sem JSON (orphans)       : {len(sem_json)}")
    print(f"{'─'*62}")

    if sem_json:
        print(f"\n  Arquivos SEM .json — corrija com:  sup --gerar-json-locais\n")
        for nome in sem_json:
            caminho = os.path.join(alvo, nome)
            try:
                bruto = open(caminho, encoding="utf-8").read(512)
                rotulo = "padrão sistema" if app.txt_tem_formato_padrao_sistema(bruto) else "texto cru"
                tamanho = os.path.getsize(caminho)
            except OSError:
                rotulo, tamanho = "?", 0
            print(f"    • {nome:<52} {tamanho:>7} bytes  [{rotulo}]")
    if pendentes:
        print(f"\n  Com JSON mas NÃO indexados — indexe com:  sup --local\n")
        for nome in pendentes:
            print(f"    • {nome}")
    if not sem_json and not pendentes:
        print("\n  ✅ Tudo indexado — base em dia!")
    print(f"\n{'═'*62}\n")


def pipeline_artigos_em_lote(app, urls: List[str]) -> None:
    app._ensure_db()
    urls_validas: List[str] = []
    for url in urls:
        u = url.strip()
        if not u.startswith(("http://", "https://")):
            print(f"⚠️  Ignorando (URL inválida): {u}")
            continue
        if app._eh_url_youtube(u):
            print(f"⚠️  Ignorando (é YouTube, use opção de vídeos): {u}")
            continue
        urls_validas.append(u.rstrip("/"))
    if not urls_validas:
        print("Nenhuma URL de artigo válida para processar.")
        return

    processadas = app.carregar_processadas()
    novas = [u for u in urls_validas if u not in processadas]
    ja_indexadas = len(urls_validas) - len(novas)
    total = len(novas)
    print(f"\n{'═'*55}")
    print(f"  📄 LOTE DE ARTIGOS — {total} novo(s) | {ja_indexadas} já indexado(s)")
    print(f"{'═'*55}")
    if not novas:
        print("✅ Todos os artigos já estavam indexados. Nada a fazer.")
        return

    total_chunks = 0
    erros = 0
    threads = app.RAG_ARTIGOS_FETCH_THREADS
    por_url: Dict[str, Optional[dict]] = {}
    if threads > 1 and len(novas) >= 2:
        w = min(threads, len(novas))
        print(f"  ⚡ Download paralelo: {w} thread(s) | parser HTML: {app.BS_PARSER}")
        with concurrent.futures.ThreadPoolExecutor(max_workers=w) as ex:
            futuros = [ex.submit(app._baixar_e_raspar_artigo, u) for u in novas]
            for fut in concurrent.futures.as_completed(futuros):
                u, dados = fut.result()
                por_url[u] = dados
        for i, url in enumerate(novas, start=1):
            print(f"\n[{i}/{total}] 📄 {url}")
            artigo = por_url.get(url)
            if not artigo:
                erros += 1
                continue
            n = app.processar_artigo(url, processadas, atualizar_catalogo=False, artigo=artigo)
            if n < 0:
                erros += 1
            else:
                total_chunks += n
            if i < total:
                time.sleep(app.PAUSA_ENTRE_REQS)
    else:
        for i, url in enumerate(novas, start=1):
            print(f"\n[{i}/{total}] 📄 {url}")
            n = app.processar_artigo(url, processadas, atualizar_catalogo=False)
            if n < 0:
                erros += 1
            else:
                total_chunks += n
            if i < total:
                time.sleep(app.PAUSA_ENTRE_REQS)

    print(f"\n{'═'*55}")
    print(f"  ✅ {total - erros} indexado(s) | {erros} erro(s)")
    print(f"  📦 Chunks nesta execução    : {total_chunks}")
    print(f"  📦 Total de chunks no banco : {app.colecao.count()}")
    print(f"{'═'*55}")
    app.salvar_catalogo()


def pipeline_videos_em_lote(app, urls: List[str]) -> None:
    app._ensure_db()
    urls_normalizadas = []
    for url in urls:
        url = app._normalizar_url_yt(url)
        if not app._eh_url_youtube(url):
            print(f"⚠️  Ignorando (não é YouTube): {url}")
            continue
        urls_normalizadas.append(url)
    if not urls_normalizadas:
        print("Nenhuma URL válida para processar.")
        return

    processadas = app.carregar_processadas()
    novas = [u for u in urls_normalizadas if u not in processadas]
    ja_indexadas = len(urls_normalizadas) - len(novas)
    total = len(novas)
    print(f"\n{'═'*55}")
    print(f"  🎬 LOTE DE VÍDEOS — {total} novo(s) | {ja_indexadas} já indexado(s)")
    print(f"{'═'*55}")
    if total >= 2:
        print(
            f"  ⏱️  Pausa entre vídeos: {app.RAG_YT_PAUSA_ENTRE_VIDEOS}s + aleatório 0–{app.RAG_YT_PAUSA_JITTER}s "
            "(export RAG_YT_PAUSA_ENTRE_VIDEOS / RAG_YT_PAUSA_JITTER para ajustar)"
        )
    if not novas:
        print("✅ Todos os vídeos já estavam indexados. Nada a fazer.")
        return

    total_chunks = 0
    erros = 0
    ipblock_seq = 0
    for i, url in enumerate(novas, start=1):
        print(f"\n[{i}/{total}] 🎬 {url}")
        n = app.processar_video(url, processadas, atualizar_catalogo=False)
        if n == -2:
            ipblock_seq += 1
            erros += 1
            if app.RAG_YT_STOP_ON_IPBLOCK and ipblock_seq >= app.RAG_YT_MAX_CONSEC_IPBLOCK:
                print(f"\n⛔ Bloqueio de IP detectado ({ipblock_seq}x). Parando lote para não agravar."
                      f"\n   Aguarde ~{int(app.RAG_YT_IPBLOCK_COOLDOWN_S)}s e tente novamente.")
                break
        elif n < 0:
            erros += 1
        else:
            ipblock_seq = 0
            total_chunks += n
        if i < total:
            app._pausa_entre_videos_no_lote()

    print(f"\n{'═'*55}")
    print(f"  ✅ {total - erros} indexado(s) | {erros} erro(s)")
    print(f"  📦 Chunks nesta execução    : {total_chunks}")
    print(f"  📦 Total de chunks no banco : {app.colecao.count()}")
    print(f"{'═'*55}")
    app.salvar_catalogo()


def pipeline_crawler(
    app,
    url_listagem: str,
    filtro_path: Optional[str] = None,
    sem_paginacao: bool = False,
) -> None:
    processadas = app.carregar_processadas()
    encontrados = app.descobrir_links(
        url_listagem, filtro_path=filtro_path, seguir_paginacao=not sem_paginacao
    )
    artigos = [u for u in encontrados["artigos"] if u not in processadas]
    videos = [u for u in encontrados["videos"] if u not in processadas]
    pulados = (len(encontrados["artigos"]) - len(artigos)) + (len(encontrados["videos"]) - len(videos))
    print(f"\n📋 Novos: {len(artigos)} artigo(s) + {len(videos)} vídeo(s)  |  {pulados} já processado(s)")
    if not artigos and not videos:
        print("✅ Tudo já indexado. Nada a fazer.")
        return

    total_chunks = 0
    erros = 0
    total = len(artigos) + len(videos)
    i = 0
    for url in artigos:
        i += 1
        print(f"\n[{i}/{total}] 📄 {url}")
        n = app.processar_artigo(url, processadas, atualizar_catalogo=False)
        if n < 0:
            erros += 1
        else:
            total_chunks += n
        if i < total:
            time.sleep(app.PAUSA_ENTRE_REQS)
    for url in videos:
        i += 1
        print(f"\n[{i}/{total}] 🎬 {url}")
        n = app.processar_video(url, processadas, atualizar_catalogo=False)
        if n < 0:
            erros += 1
        else:
            total_chunks += n
        if i < total:
            app._pausa_entre_videos_no_lote()

    print(f"\n{'═'*55}")
    print(f"  ✅ {total - erros} indexado(s) | {erros} erro(s)")
    print(f"  📦 Chunks nesta execução    : {total_chunks}")
    print(f"  📦 Total de chunks no banco : {app.colecao.count()}")
    print(f"  💾 Arquivos em: {app.PASTA_SAIDA}")
    print(f"{'═'*55}")
    app.salvar_catalogo()


def status_indice(app) -> None:
    app._ensure_db()
    processadas = app.carregar_processadas()
    arquivos_json = [f for f in os.listdir(app.PASTA_SAIDA) if f.endswith(".json")] if os.path.exists(app.PASTA_SAIDA) else []
    artigos_count = sum(1 for u in processadas if "youtube" not in u)
    videos_count = sum(1 for u in processadas if "youtube" in u)
    dominios: dict = {}
    for u in processadas:
        if "youtube" not in u:
            d = urlparse(u).netloc
            dominios[d] = dominios.get(d, 0) + 1

    print(f"\n{'═'*55}")
    print("  📊 STATUS DA BASE DE CONHECIMENTO")
    print(f"{'═'*55}")
    print(f"  Pasta            : {app.PASTA_SAIDA}")
    print(f"  Banco vetorial   : {app.PASTA_CHROMA}")
    print(f"  Artigos indexados: {artigos_count}")
    print(f"  Vídeos YT        : {videos_count}")
    print(f"  Arquivos .json   : {len(arquivos_json)}")
    print(f"  Chunks no banco  : {app.colecao.count()}")
    print(f"  Modelo resposta  : {app.MODELO_POTENTE}")
    print(f"  Modelo rápido    : {app.MODELO_RAPIDO}")
    if dominios:
        print(f"\n  {'Domínio':<42} {'Artigos':>7}")
        print(f"  {'─'*50}")
        for d, n in sorted(dominios.items(), key=lambda x: -x[1]):
            print(f"  {d:<42} {n:>7}")
    catalogo = os.path.join(app.PASTA_SAIDA, "_CATALOGO.md")
    if os.path.exists(catalogo):
        import datetime
        ts = os.path.getmtime(catalogo)
        dt = datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
        print(f"\n  📋 Catálogo atualizado em: {dt}")
    print(f"{'═'*55}")
    app.salvar_catalogo()
