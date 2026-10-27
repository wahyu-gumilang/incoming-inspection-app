<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Items · Incoming Inspection QC</title>
    @livewireStyles
    <style>
        :root {
            --brand: #004f9c;
            --bg: #f4f6fa;
            --surface: #fff;
            --border: #e3e8ef;
            --text: #0f172a;
            --text-2: #475569;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--text);
        }
        .topbar {
            display: flex;
            align-items: center;
            gap: 12px;
            height: 64px;
            padding: 0 24px;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
        }
        .topbar strong { color: var(--brand); font-size: 18px; letter-spacing: -0.02em; }
        .topbar span { color: var(--text-2); font-size: 13px; }
        main { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }
        .poc-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, .05);
        }
        .poc-toolbar {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 20px;
        }
        h1 { margin: 0 0 4px; font-size: 22px; letter-spacing: -0.02em; }
        p { margin: 0; color: var(--text-2); font-size: 13px; }
        input[type="search"] {
            width: 280px;
            height: 42px;
            padding: 0 14px;
            border: 1px solid #cfd7e3;
            border-radius: 10px;
            background: #f8fafc;
            font: inherit;
        }
        input[type="search"]:focus { outline: 3px solid rgba(0, 79, 156, .2); border-color: var(--brand); }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { padding: 11px 12px; text-align: left; border-bottom: 1px solid var(--border); }
        th { font-size: 12px; color: var(--text-2); background: #f8fafc; }
        tbody tr:hover { background: #f8fafc; }
        .mono { font-variant-numeric: tabular-nums; font-weight: 600; }
        .empty { text-align: center; color: var(--text-2); padding: 28px; }
        .poc-note { margin-top: 14px; font-size: 12px; color: var(--text-2); }
        code { background: #eef2f7; padding: 1px 5px; border-radius: 4px; }
        @media (max-width: 640px) {
            .poc-toolbar { flex-direction: column; }
            input[type="search"] { width: 100%; }
        }
    </style>
</head>
<body>
    <header class="topbar">
        <strong>Chubbsafes</strong>
        <span>Incoming Inspection QC · Laravel POC</span>
    </header>

    <main>
        <livewire:items.item-list />
    </main>

    @livewireScripts
</body>
</html>
