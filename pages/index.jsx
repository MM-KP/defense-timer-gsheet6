import { useState, useEffect } from "react";

const activityOptions = [
  "①接見（面会時間＊電話連絡も含む）",
  "②接見（移動時間）",
  "③接見（待機時間）",
  "④面談・連絡・打合せ",
  "⑤示談交決・被害貰儀",
  "⑥検察官・裏人との折術（意見書作成含む）",
  "⑦身体押束関係手続（動畜理由開示請求等）",
  "⑧その他（①～⑦に該当しない弁護活動）"
];

function formatDuration(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function Home() {
  const [activity, setActivity] = useState(activityOptions[0]);
  const [startTime, setStartTime] = useState(null);
  const [logs, setLogs] = useState([]);
  const [suspect, setSuspect] = useState("");

  const start = () => setStartTime(new Date());

  const stop = () => {
    const end = new Date();
    if (startTime) {
      const durationMs = end - startTime;
      const duration = formatDuration(durationMs);
      const newLog = {
        activity,
        start: startTime.toLocaleTimeString(),
        end: end.toLocaleTimeString(),
        duration,
        date: new Date()
      };
      setLogs([...logs, newLog]);
      setStartTime(null);

      const d = new Date();
      fetch("https://script.google.com/macros/s/AKfycbwyK5onxitR3JHOkw_O9lxGKrYnPOHU901BClppZKSYiFgf8VMOG9bqNIa67SmqA-PotA/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          suspect,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate(),
          start: startTime.toLocaleTimeString(),
          end: end.toLocaleTimeString(),
          duration,
          activity
        })
      })
      .then(res => console.log("送信成功"))
      .catch(err => console.error("送信失敗", err));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>弁護活動タイマー</h2>
      <input placeholder="事件名" value={suspect} onChange={e => setSuspect(e.target.value)} />
      <select value={activity} onChange={e => setActivity(e.target.value)}>
        {activityOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
      <button onClick={start}>開始</button>
      <button onClick={stop}>終了</button>
    </div>
  );
}
