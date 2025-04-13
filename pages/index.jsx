import { useEffect, useState } from "react";

const activityOptions = [
  "①接見（面会時間＊電話連絡も含む）",
  "②接見（移動時間）",
  "③接見（待機時間）",
  "④面談・連絡・打合せ",
  "⑤示談交渉・被害弁償",
  "⑥検察官・裁判官との折衝（意見書作成含む）",
  "⑦身体拘束関係手続（勾留理由開示請求等）",
  "⑧その他（①～⑦に該当しない弁護活動）",
];

const formatDuration = (ms) => {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ⬇️ CSVダウンロード関数の追加
const downloadCSV = (logs, suspect) => {
  const header = "事件名,年,月,日,開始,終了,所要時間,活動項目\n";
  const rows = logs.map(log => {
    return [
      log.suspect || "",
      log.year,
      log.month,
      log.day,
      log.start,
      log.end,
      log.duration,
      log.activity
    ].join(",");
  }).join("\n");

  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${suspect || "defense"}_logs.csv`;
  a.click();
};

export default function Home() {
  const [suspect, setSuspect] = useState("");
  const [activity, setActivity] = useState(activityOptions[0]);
  const [startTime, setStartTime] = useState(null);
  const [logs, setLogs] = useState([]);

  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbwyK5onxitR3JHOkw_O9lxGKrYnPOHU901BClppZKSYiFgf8VMOG9bqNIa67SmqA-PotA/exec";

  useEffect(() => {
    if (!suspect) return;
    fetch(`${GAS_URL}?suspect=${encodeURIComponent(suspect)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch((err) => console.error("読み込み失敗", err));
  }, [suspect]);

  const start = () => {
    setStartTime(new Date());
  };

  const stop = () => {
    const end = new Date();
    if (!startTime) return;

    const durationMs = end - startTime;
    const duration = formatDuration(durationMs);
    const d = new Date();

    const newLog = {
      suspect,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      start: startTime.toLocaleTimeString(),
      end: end.toLocaleTimeString(),
      duration,
      activity,
    };

    setLogs([...logs, newLog]);
    setStartTime(null);

    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLog),
    })
      .then(() => console.log("送信成功"))
      .catch((err) => console.error("送信失敗", err));
  };

  const updateField = (idx, field, value) => {
    const updated = [...logs];
    updated[idx][field] = value;
    setLogs(updated);
  };

  const deleteRow = (idx) => {
    const updated = logs.filter((_, i) => i !== idx);
    setLogs(updated);
  };

  return (
    <div style={{ padding: 20, maxWidth: 960, margin: "auto" }}>
      <h2>弁護活動タイマー（Googleスプレッドシート連携）</h2>

      <div style={{ marginBottom: 10 }}>
        <label>事件名（被疑者名）: </label>
        <input
          type="text"
          value={suspect}
          onChange={(e) => setSuspect(e.target.value)}
          placeholder="例：山田太郎"
        />
      </div>

      <div>
        <label>活動項目: </label>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        >
          {activityOptions.map((a, i) => (
            <option key={i} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={start} disabled={!!startTime}>
          開始
        </button>
        <button onClick={stop} disabled={!startTime}>
          終了
        </button>
        {/* ⬇️ ここにCSV出力ボタンを追加 */}
        <button
          style={{ marginLeft: 10 }}
          onClick={() => downloadCSV(logs, suspect)}
        >
          CSVダウンロード
        </button>
      </div>

      <h3 style={{ marginTop: 20 }}>記録一覧</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>事件名</th>
            <th>年</th>
            <th>月</th>
            <th>日</th>
            <th>開始</th>
            <th>終了</th>
            <th>所要時間</th>
            <th>活動項目</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx}>
              <td>
                <input
                  value={log.suspect}
                  onChange={(e) => updateField(idx, "suspect", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={log.year}
                  onChange={(e) => updateField(idx, "year", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={log.month}
                  onChange={(e) => updateField(idx, "month", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={log.day}
                  onChange={(e) => updateField(idx, "day", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={log.start}
                  onChange={(e) => updateField(idx, "start", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={log.end}
                  onChange={(e) => updateField(idx, "end", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={log.duration}
                  onChange={(e) =>
                    updateField(idx, "duration", e.target.value)
                  }
                />
              </td>
              <td>
                <select
                  value={log.activity}
                  onChange={(e) => updateField(idx, "activity", e.target.value)}
                >
                  {activityOptions.map((a, i) => (
                    <option key={i} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button onClick={() => deleteRow(idx)} style={{ color: "red" }}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
