import PDFDocument from 'pdfkit';
import Excel from 'exceljs';
import { saveAs } from 'file-saver';
import { Attendance } from '@shared/schema';

// Type for attendance report data
export interface AttendanceReportData {
  unitName: string;
  courseName: string;
  levelName: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  students: {
    id: number;
    fullName: string;
    studentId: string;
    isPresent: boolean;
    markedAt?: Date;
  }[];
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number;
}

/**
 * Generate and download a PDF attendance report
 */
export async function exportToPDF(reportData: AttendanceReportData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({ margin: 50 });
      
      // Collect the PDF data chunks
      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // When document is done, resolve the promise with the PDF blob
      doc.on('end', () => {
        const pdfBlob = new Blob(chunks, { type: 'application/pdf' });
        saveAs(pdfBlob, `${reportData.unitName}_${formatDate(reportData.date)}_attendance.pdf`);
        resolve();
      });

      // Add content to the PDF
      addHeaderToPDF(doc, reportData);
      addAttendanceTableToPDF(doc, reportData);
      addSummaryToPDF(doc, reportData);
      addFooterToPDF(doc);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Generate and download an Excel attendance report
 */
export async function exportToExcel(reportData: AttendanceReportData): Promise<void> {
  try {
    // Create a new workbook
    const workbook = new Excel.Workbook();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet('Attendance Report');
    
    // Add header row with styling
    worksheet.addRow(['College Attendance System - Attendance Report']);
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    
    // Add report information
    worksheet.addRow([]);
    worksheet.addRow(['Unit:', reportData.unitName]);
    worksheet.addRow(['Course:', reportData.courseName]);
    worksheet.addRow(['Level:', reportData.levelName]);
    worksheet.addRow(['Date:', formatDate(reportData.date)]);
    worksheet.addRow(['Time:', `${reportData.startTime} - ${reportData.endTime}`]);
    worksheet.addRow(['Location:', reportData.location]);
    worksheet.addRow([]);
    
    // Add table headers
    const headerRow = worksheet.addRow(['No.', 'Student ID', 'Full Name', 'Status', 'Time Marked']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add student rows
    reportData.students.forEach((student, index) => {
      const row = worksheet.addRow([
        index + 1,
        student.studentId,
        student.fullName,
        student.isPresent ? 'Present' : 'Absent',
        student.markedAt ? formatTime(student.markedAt) : '-'
      ]);
      
      // Style the row based on attendance status
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Highlight present/absent status
      const statusCell = row.getCell(4);
      statusCell.font = { 
        color: { argb: student.isPresent ? 'FF008000' : 'FFFF0000' } 
      };
    });
    
    // Add summary
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Students:', reportData.students.length]);
    worksheet.addRow(['Present:', reportData.totalPresent]);
    worksheet.addRow(['Absent:', reportData.totalAbsent]);
    worksheet.addRow(['Attendance Rate:', `${reportData.attendanceRate}%`]);
    
    // Set column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 20;
    
    // Generate Excel file and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${reportData.unitName}_${formatDate(reportData.date)}_attendance.xlsx`);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw error;
  }
}

// Helper functions for PDF generation
function addHeaderToPDF(doc: PDFKit.PDFDocument, reportData: AttendanceReportData): void {
  doc.fontSize(18).font('Helvetica-Bold').text('College Attendance System', { align: 'center' });
  doc.fontSize(14).font('Helvetica-Bold').text('Attendance Report', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica');
  doc.text(`Unit: ${reportData.unitName}`);
  doc.text(`Course: ${reportData.courseName}`);
  doc.text(`Level: ${reportData.levelName}`);
  doc.text(`Date: ${formatDate(reportData.date)}`);
  doc.text(`Time: ${reportData.startTime} - ${reportData.endTime}`);
  doc.text(`Location: ${reportData.location}`);
  doc.moveDown();
}

function addAttendanceTableToPDF(doc: PDFKit.PDFDocument, reportData: AttendanceReportData): void {
  // Table header
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidths = [40, 80, 200, 80, 100];
  
  doc.font('Helvetica-Bold');
  doc.text('No.', tableLeft, tableTop);
  doc.text('Student ID', tableLeft + colWidths[0], tableTop);
  doc.text('Full Name', tableLeft + colWidths[0] + colWidths[1], tableTop);
  doc.text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
  doc.text('Time Marked', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
  
  // Draw header underline
  doc.moveTo(tableLeft, tableTop + 20)
     .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop + 20)
     .stroke();
  
  // Table rows
  let rowTop = tableTop + 30;
  doc.font('Helvetica');
  
  reportData.students.forEach((student, index) => {
    // Add a new page if needed
    if (rowTop > doc.page.height - 100) {
      doc.addPage();
      rowTop = 50;
    }
    
    doc.text((index + 1).toString(), tableLeft, rowTop);
    doc.text(student.studentId, tableLeft + colWidths[0], rowTop);
    doc.text(student.fullName, tableLeft + colWidths[0] + colWidths[1], rowTop);
    
    // Status with color
    const status = student.isPresent ? 'Present' : 'Absent';
    doc.fillColor(student.isPresent ? '#008000' : '#FF0000')
       .text(status, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowTop)
       .fillColor('#000000'); // Reset to black
    
    // Time marked
    const timeMarked = student.markedAt ? formatTime(student.markedAt) : '-';
    doc.text(timeMarked, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowTop);
    
    rowTop += 20;
  });
  
  // Update document position
  doc.y = rowTop + 10;
}

function addSummaryToPDF(doc: PDFKit.PDFDocument, reportData: AttendanceReportData): void {
  doc.font('Helvetica-Bold').text('Summary', { underline: true });
  doc.font('Helvetica');
  doc.moveDown(0.5);
  
  doc.text(`Total Students: ${reportData.students.length}`);
  doc.text(`Present: ${reportData.totalPresent}`);
  doc.text(`Absent: ${reportData.totalAbsent}`);
  doc.text(`Attendance Rate: ${reportData.attendanceRate}%`);
  doc.moveDown();
}

function addFooterToPDF(doc: PDFKit.PDFDocument): void {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Add page number
    doc.fontSize(8)
       .text(
         `Page ${i + 1} of ${pageCount}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );
    
    // Add timestamp
    doc.fontSize(8)
       .text(
         `Generated on ${new Date().toLocaleString()}`,
         50,
         doc.page.height - 35,
         { align: 'center' }
       );
  }
}

// Helper utility functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Function to convert database attendance records to report format
export function prepareAttendanceReportData(
  attendanceRecords: any[], // Using any[] to make it more flexible with the mock data
  unitName: string,
  courseName: string,
  levelName: string,
  sessionDate: Date,
  startTime: string,
  endTime: string,
  location: string,
  students: Array<{
    id: number;
    fullName: string;
    studentId: string;
  }>
): AttendanceReportData {
  // Map attendance records to student data
  const studentsWithAttendance = students.map(student => {
    const attendanceRecord = attendanceRecords.find(a => a.studentId === student.id);
    
    return {
      id: student.id,
      fullName: student.fullName,
      studentId: student.studentId,
      isPresent: attendanceRecord ? attendanceRecord.isPresent : false,
      markedAt: attendanceRecord ? new Date(attendanceRecord.markedAt) : undefined
    };
  });
  
  // Calculate summary data
  const totalPresent = studentsWithAttendance.filter(s => s.isPresent).length;
  const totalAbsent = studentsWithAttendance.length - totalPresent;
  const attendanceRate = students.length > 0 
    ? Math.round((totalPresent / students.length) * 100) 
    : 0;
  
  return {
    unitName,
    courseName,
    levelName,
    date: sessionDate,
    startTime,
    endTime,
    location,
    students: studentsWithAttendance,
    totalPresent,
    totalAbsent,
    attendanceRate
  };
}