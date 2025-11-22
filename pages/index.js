import Head from "next/head";
import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function Home() {
  const [status, setStatus] = useState("");
  const [audioPlay, setAudioPlay] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setStatus("Please upload a PDF file.");
      return;
    }

    try {
      setStatus("Reading PDF...");
      const arrayBuffer = await file.arrayBuffer();

      setStatus("Loading PDF (pdfjs)...");
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const pages = pdf.numPages;
      setStatus(`Extracting text from ${pages} page(s)...`);
      let fullText = "";

      for (let p = 1; p <= pages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((it) => (it.str ? it.str : "")).join(" ");
        fullText += pageText + "\n\n";
      }

      setStatus("Generating Word (.docx)...");
      const paragraphs = fullText.split("\n\n").map(par => new Paragraph({ children: [ new TextRun(par) ] }));
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs.length ? paragraphs : [new Paragraph("")] }] });

      const blob = await Packer.toBlob(doc);
      const filename = (file.name || "document.pdf").replace(/\.pdf$/i, ".docx");
      const url = URL.createObjectURL(blob);

      // Trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setStatus("Done — Word file downloaded.");
    } catch (err) {
      console.error(err);
      setStatus("Error converting PDF. Try a simpler text-based PDF.");
    }
  }

  return (
    <>
      <Head>
        <title>PDF → Word Converter</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <div className="container">
        <div className="card">
          <img src="/logo.svg" alt="logo" className="logo" />
          <h1>PDF → Word Converter</h1>
          <p className="lead">Convert a PDF to Word (.docx) instantly inside your browser. Files never leave your machine.</p>

          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <div>
            <button className="button" onClick={() => document.querySelector('input[type=file]').click()}>Choose PDF</button>
          </div>

          <p className="status">{status}</p>

          <div className="sample-section">
            <p className="small">Sample uploaded asset (for testing):</p>
            <p className="small">Uploaded image path (from your session): <code>/mnt/data/68b3aaf5-b113-461d-9a81-a668a24e9e24.png</code></p>
            <p className="small">If you want a sample PDF in the UI, upload a PDF to <code>public/sample.pdf</code> in your repo and refresh.</p>
          </div>
        </div>
      </div>
    </>
  );
}
