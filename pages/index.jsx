
import { useState, useEffect } from "react";

const activityOptions = [
  "①接見（面会時間＊電話連絡も含む）",
  "②接見（移動時間）",
  "③接見（待機時間）",
  "④面談・連絡・打合せ",
  "⑤示談交渉・被害弁償",
  "⑥検察官・裁判官との折衝（意見書作成含む）",
  "⑦身体拘束関係手続（勾留理由開示請求等）",
  "⑧その他（①～⑦に該当しない弁護活動）"
];

function formatDuration(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function downloadCSV(logs, suspect) {
  const header = "年,月,日,開始時間,終了時間,所要時間,項目\n";
  const rows = logs.map(log => {
    const d = new Date(log.date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return [y, m, day, log.start, log.end, log.duration, log.activity].join(",");
  }).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${suspect || "defense"}_logs.csv`;
  a.click();
}

export default function Home() {
  const [activity, setActivity] = useState(activityOptions[0]);
  const [startTime, setStartTime] = useState(null);
  const [logs, setLogs] = useState([]);
  const [suspect, setSuspect] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("defense_logs_by_suspect");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[suspect]) setLogs(parsed[suspect]);
    }
  }, [suspect]);

  useEffect(() => {
    const saved = localStorage.getItem("defense_logs_by_suspect");
    const all = saved ? JSON.parse(saved) : {};
    all[suspect] = logs;
    localStorage.setItem("defense_logs_by_suspect", JSON.stringify(all));
  }, [logs, suspect]);

  const start = () => {
    setStartTime(new Date());
  };

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
    // Google スプレッドシート送信
    const d = new Date();
    fetch("https://script.google.com/macros/s/AKfycbwyK5onxitR3JHOkw_O9lxGKrYnPOHU901BClppZKSYiFgf8VMOG9bqNIa67SmqA-PotA/exec", {
      method: "POST",
      body: JSON.stringify({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        start: startTime.toLocaleTimeString(),
        end: end.toLocaleTimeString(),
        duration,
        activity
      })
    }).then(res => console.log("送信成功")).catch(err => console.error("送信失敗", err));

    }
  };

  const updateField = (idx, field, value) => {
    const updatedLogs = [...logs];
    const log = { ...updatedLogs[idx] };
    if (['year', 'month', 'day'].includes(field)) {
      const d = new Date(log.date);
      if (field === 'year') d.setFullYear(value);
      if (field === 'month') d.setMonth(value - 1);
      if (field === 'day') d.setDate(value);
      log.date = d;
    } else {
      log[field] = value;
    }
    updatedLogs[idx] = log;
    setLogs(updatedLogs);
  };

  const deleteRow = (idx) => {
    const updatedLogs = logs.filter((_, i) => i !== idx);
    setLogs(updatedLogs);
  };

  return (
    <div style={{ padding: 20, maxWidth: 960, margin: "auto" }}>
      <h2>弁護活動タイマー（記録・CSV出力・被疑者ごと保存）</h2>

      <div style={{ marginBottom: 10 }}>
        <label>事件名・被疑者名：</label>
        <input type="text" value={suspect} onChange={e => setSuspect(e.target.value)} placeholder="例：山田太郎" />
      </div>

      <div>
        <label>活動項目：</label>
        <select value={activity} onChange={e => setActivity(e.target.value)}>
          {activityOptions.map((a, i) => (
            <option key={i} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={start} disabled={!!startTime}>開始</button>
        <button onClick={stop} disabled={!startTime}>終了</button>
        <button onClick={() => downloadCSV(logs, suspect)} style={{ marginLeft: 10 }}>CSV出力</button>
        <button onClick={() => {
          const confirmed = confirm("本当にこの事件の記録を削除しますか？");
          if (confirmed) {
            const saved = localStorage.getItem("defense_logs_by_suspect");
            const all = saved ? JSON.parse(saved) : {};
            delete all[suspect];
            localStorage.setItem("defense_logs_by_suspect", JSON.stringify(all));
            setLogs([]);
          }
        }} style={{ marginLeft: 10, color: 'red' }}>この事件の記録を削除</button>
      </div>

      <h3 style={{ marginTop: 20 }}>記録一覧</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>年</th><th>月</th><th>日</th><th>開始</th><th>終了</th><th>所要時間</th><th>活動項目</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const d = new Date(log.date);
            return (
              <tr key={idx}>
                <td><input value={d.getFullYear()} onChange={e => updateField(idx, 'year', e.target.value)} style={{ width: "4em" }} /></td>
                <td><input value={d.getMonth() + 1} onChange={e => updateField(idx, 'month', e.target.value)} style={{ width: "3em" }} /></td>
                <td><input value={d.getDate()} onChange={e => updateField(idx, 'day', e.target.value)} style={{ width: "3em" }} /></td>
                <td><input value={log.start} onChange={e => updateField(idx, 'start', e.target.value)} /></td>
                <td><input value={log.end} onChange={e => updateField(idx, 'end', e.target.value)} /></td>
                <td><input value={log.duration} onChange={e => updateField(idx, 'duration', e.target.value)} /></td>
                <td>
                  <select value={log.activity} onChange={e => updateField(idx, 'activity', e.target.value)}>
                    {activityOptions.map((a, i) => <option key={i} value={a}>{a}</option>)}
                  </select>
                </td>
                <td><button onClick={() => deleteRow(idx)} style={{ color: 'red' }}>削除</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
