// ============================================================
// PDF VIEWER COMPONENT — react-pdf (pdfjs-dist, 100% local)
// ============================================================
import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFViewer.css';

// Use a fixed version from cdnjs to match the installed package version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.7.284/pdf.worker.min.mjs`;

interface PDFViewerProps {
  /** Either a URL string or a File object */
  source: string | File;
}

export default function PDFViewer({ source }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [error, setError] = useState<string | null>(null);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }, []);

  const onLoadError = useCallback((err: Error) => {
    setError(`Erro ao carregar PDF: ${err.message}`);
  }, []);

  const prev = () => setPageNumber((p) => Math.max(1, p - 1));
  const next = () => setPageNumber((p) => Math.min(numPages, p + 1));

  if (error) return <div className="pdf-error">{error}</div>;

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <div className="pdf-controls">
          <button
            id="pdf-prev"
            className="btn btn-ghost btn-sm"
            onClick={prev}
            disabled={pageNumber <= 1}
          >
            ← Anterior
          </button>
          <span className="pdf-page-info">
            Página <strong>{pageNumber}</strong> de <strong>{numPages}</strong>
          </span>
          <button
            id="pdf-next"
            className="btn btn-ghost btn-sm"
            onClick={next}
            disabled={pageNumber >= numPages}
          >
            Próxima →
          </button>
        </div>
        <div className="pdf-zoom">
          <button className="btn btn-ghost btn-sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>−</button>
          <span className="pdf-zoom-val">{Math.round(scale * 100)}%</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}>+</button>
        </div>
      </div>

      <div className="pdf-canvas-wrap">
        <Document
          file={source}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={
            <div className="pdf-loading">
              <div className="spinner spinner-lg" />
              <p>Carregando PDF…</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
}
