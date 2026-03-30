import React from "react";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export interface ExportDropdownProps<T> {
  /** El arreglo de datos a exportar (ej. la lista de exploradores) */
  data: T[];
  /** Cabeceras de las columnas (ej. ["Código", "Nombre"]) */
  columns: string[];
  /** El nombre del archivo a descargar (sin la extensión) */
  filename: string;
  /** El título que aparecerá en la parte superior del documento PDF */
  title: string;
  /** Función para mapear un objeto de dato a un arreglo de valores para la fila */
  rowMapper: (item: T) => (string | number)[];
}

export function ExportDropdown<T>({
  data,
  columns,
  filename,
  title,
  rowMapper,
}: ExportDropdownProps<T>) {

  const handleExportExcel = () => {
    // Generar la matriz bidimensional con cabeceras y datos
    const sheetData = [columns, ...data.map(rowMapper)];
    
    // Crear el libro de trabajo y la hoja
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
    
    // Anexar la hoja
    xlsx.utils.book_append_sheet(workbook, worksheet, "Datos");
    
    // Guardar el archivo
    xlsx.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExportPDF = () => {
    // Crear instancia de jsPDF (orientación apaisada suele ser mejor para tablas)
    const doc = new jsPDF("landscape");
    
    // Mapear los datos a filas simples
    const bodyData = data.map(rowMapper);

    // Configurar estilo del autoTable
    autoTable(doc, {
      head: [columns],
      body: bodyData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: "helvetica",
      },
      headStyles: {
        fillColor: [13, 148, 136], // Teal 600
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { top: 25 },
      didDrawPage: (dataArg) => {
        // Añadir el Header del documento en cada página
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text(title, dataArg.settings.margin.left, 15);
        
        // Añadir fecha de generación
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Slate 500
        const dateStr = new Date().toLocaleDateString("es-ES", {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        doc.text(`Generado: ${dateStr}`, dataArg.settings.margin.left, 20);
      },
    });

    doc.save(`${filename}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 h-9 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <Download className="w-4 h-4 text-slate-500" />
        <span className="hidden sm:inline">Exportar</span>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1">
        <DropdownMenuItem 
          onClick={handleExportExcel}
          className="cursor-pointer gap-2 py-2 text-sm text-slate-700 hover:text-slate-900 focus:bg-slate-100 rounded-lg transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar a Excel
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleExportPDF}
          className="cursor-pointer gap-2 py-2 text-sm text-slate-700 hover:text-slate-900 focus:bg-slate-100 rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4 text-rose-600" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
