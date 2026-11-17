import { useEffect, useState } from "react";

const controls = [
  { key: "roundness", label: "Roundness", min: 0, max: 100, step: 1 },
  { key: "textWeight", label: "Text weight", min: 300, max: 600, step: 10 },
  { key: "headlineWeight", label: "Headline weight", min: 400, max: 900, step: 10 },
  { key: "opticalSize", label: "Optical size", min: 9, max: 32, step: 1 },
] as const;
const defaults = { roundness: 50, textWeight: 400, headlineWeight: 700, opticalSize: 14, autoOpticalSize: true };
const storageKey = "allo-font-demo";

/** Temporary preview controls; remove this component and its CSS after choosing values. */
export function FontDemo() {
  const [values, setValues] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const exportText = JSON.stringify({ font: "Allo", ...values, opticalSize: values.autoOpticalSize ? "auto" : values.opticalSize, disambiguation: "ss02" }, null, 2);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && controls.every(({ key, min, max }) => typeof saved[key] === "number" && saved[key] >= min && saved[key] <= max) && typeof saved.autoOpticalSize === "boolean") setValues(saved);
    } catch { /* Storage may be unavailable in private browsing. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch { /* Keep controls usable without storage. */ }
  }, [values, ready]);

  useEffect(() => { setCopied(false); setManualCopy(false); }, [values]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
    } catch { setManualCopy(true); }
  }

  return (
    <>
      <style>{`
        body { font-variation-settings: "ROND" ${values.roundness}${values.autoOpticalSize ? "" : `, "opsz" ${values.opticalSize}`}; font-weight: ${values.textWeight}; font-optical-sizing: ${values.autoOpticalSize ? "auto" : "none"}; }
        h2 { font-weight: ${values.headlineWeight}; }
        .font-serif { font-variation-settings: normal; font-optical-sizing: auto; font-weight: 400; }
      `}</style>
      <details className="font-demo" open>
        <summary>Font demo</summary>
        <div className="font-demo-controls">
          {controls.map(({ key, label, min, max, step }) => (
            <label key={key} className="font-demo-slider">
              <span>{label} <output>{key === "opticalSize" && values.autoOpticalSize ? "Auto" : values[key]}</output></span>
              <input type="range" min={min} max={max} step={step} value={values[key]} disabled={key === "opticalSize" && values.autoOpticalSize}
                onChange={(event) => setValues({ ...values, [key]: Number(event.target.value) })} />
            </label>
          ))}
          <label className="font-demo-auto"><input type="checkbox" checked={values.autoOpticalSize} onChange={(event) => setValues({ ...values, autoOpticalSize: event.target.checked })} /> Automatic optical size</label>
          <div className="font-demo-actions">
            <button type="button" onClick={() => setValues({ ...defaults })}>Reset</button>
            <button type="button" onClick={copy}>{copied ? "Copied" : "Copy values"}</button>
          </div>
          {manualCopy && <label>Select and copy<textarea readOnly value={exportText} onFocus={(event) => event.target.select()} /></label>}
          <span className="sr-only" role="status">{copied ? "Values copied" : ""}</span>
        </div>
      </details>
    </>
  );
}
