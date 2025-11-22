import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Document, Paragraph, Packer } from "docx";

export default function Home() {
  const [status, setStatus] = useState("");

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setStatus("Reading PDF...");

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      setStatus("Extracting text...");

      let fullText = "";

      const pages = pdf.getPages();
      for (let p = 0; p < pages.length; p++) {
        const text = await pages[p].getTextContent();
        const pageText = text.items.map((t) => t.str).join(" ");
        fullText += pageText + "\n\n";
      }

      setStatus("Generating Word file...");

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph(fullText)],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = file.name.replace(".pdf", ".docx");
      downloadLink.click();

      setStatus("Done! Downloaded.");
    } catch (err) {
      console.error(err);
      setStatus("Error converting PDF.");
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>PDF → Word Converter</h1>

      <input type="file" accept="application/pdf" onChange={handleFile} />

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>{status}</p>
    </div>
  );
}
