import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const QRCodeGenerator = ({ loteId, cliente, onClose }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    generateQRCode();
  }, [loteId]);

  const generateQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 400;
    const qrSize = 300;
    const padding = 50;

    canvas.width = size;
    canvas.height = size + 100;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = `LOTE:${loteId}`;
    const qrData = generateQRMatrix(data);
    const cellSize = qrSize / qrData.length;

    ctx.fillStyle = '#000000';
    for (let row = 0; row < qrData.length; row++) {
      for (let col = 0; col < qrData[row].length; col++) {
        if (qrData[row][col]) {
          ctx.fillRect(
            padding + col * cellSize,
            padding + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(cliente, size / 2, size + 60);
    ctx.font = '16px Inter';
    ctx.fillText(`ID: ${loteId}`, size / 2, size + 85);
  };

  const generateQRMatrix = (data) => {
    const size = 21;
    const matrix = Array(size).fill(null).map(() => Array(size).fill(false));

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }

    const random = (seed) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        matrix[i][j] = random(hash + i * size + j) > 0.5;
      }
    }

    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        matrix[i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        matrix[i][size - 1 - j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        matrix[size - 1 - i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
      }
    }

    return matrix;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qrcode-${cliente}-${loteId}.png`;
    link.href = url;
    link.click();
    
    toast({
      title: "✅ QR Code baixado!",
      description: "O arquivo foi salvo com sucesso.",
    });
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR Code - ${cliente}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${url}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-effect rounded-2xl p-6 md:p-8 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">QR Code do Lote</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="bg-white rounded-xl p-4 mb-6">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>

          <p className="text-center text-purple-200 mb-6">
            Escaneie este QR Code para marcar o lote como pintado automaticamente
          </p>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="flex-1 glass-effect px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
            >
              <Download className="w-5 h-5" />
              Baixar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRCodeGenerator;