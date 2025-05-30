import { saveAs } from 'file-saver';
import * as Excel from 'exceljs';

/**
 * Type for attendance data
 */
export interface AttendanceData {
  unitName: string;
  courseName: string;
  levelName: string;
  date: Date;
  time: string;
  location: string;
  students: {
    id: number;
    fullName: string;
    studentId: string;
    status: 'Present' | 'Absent';
    timeMarked?: string;
  }[];
  summary: {
    total: number;
    present: number;
    absent: number;
    rate: number;
  };
}

/**
 * Export attendance data to Excel file
 */
export async function exportToExcel(data: AttendanceData): Promise<void> {
  try {
    // Create a new workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');
    
    // Add title
    worksheet.addRow(['College Attendance System - Attendance Report']);
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    
    // Add metadata
    worksheet.addRow([]);
    worksheet.addRow(['Unit:', data.unitName]);
    worksheet.addRow(['Course:', data.courseName]);
    worksheet.addRow(['Level:', data.levelName]);
    worksheet.addRow(['Date:', data.date.toLocaleDateString()]);
    worksheet.addRow(['Time:', data.time]);
    worksheet.addRow(['Location:', data.location]);
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
    data.students.forEach((student, index) => {
      const row = worksheet.addRow([
        index + 1,
        student.studentId,
        student.fullName,
        student.status,
        student.timeMarked || '-'
      ]);
      
      // Add cell borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Color status cell
      const statusCell = row.getCell(4);
      statusCell.font = { 
        color: { argb: student.status === 'Present' ? 'FF008000' : 'FFFF0000' } 
      };
    });
    
    // Add summary
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.getCell('A' + worksheet.rowCount).font = { bold: true };
    
    worksheet.addRow(['Total Students:', data.summary.total]);
    worksheet.addRow(['Present:', data.summary.present]);
    worksheet.addRow(['Absent:', data.summary.absent]);
    worksheet.addRow(['Attendance Rate:', data.summary.rate + '%']);
    
    // Set column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 20;
    
    // Generate Excel buffer and save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${data.unitName}_attendance_${formatDateForFilename(data.date)}.xlsx`);
    
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw error;
  }
}

/**
 * Helper function to format date for filenames
 */
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convert raw data to the attendance report format
 */
export function prepareAttendanceData(
  unitName: string,
  courseName: string,
  levelName: string,
  date: Date,
  startTime: string,
  endTime: string,
  location: string,
  students: any[]
): AttendanceData {
  // Process student data
  const processedStudents = students.map(student => ({
    id: student.id,
    fullName: student.fullName,
    studentId: student.studentId,
    status: student.isPresent ? 'Present' as const : 'Absent' as const,
    timeMarked: student.markedAt ? new Date(student.markedAt).toLocaleTimeString() : undefined
  }));
  
  // Calculate summary
  const present = processedStudents.filter(s => s.status === 'Present').length;
  const total = processedStudents.length;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  
  return {
    unitName,
    courseName,
    levelName,
    date,
    time: `${startTime} - ${endTime}`,
    location,
    students: processedStudents,
    summary: {
      total,
      present,
      absent,
      rate
    }
  };
}