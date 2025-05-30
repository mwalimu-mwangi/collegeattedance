import { saveAs } from "file-saver";
import * as ExcelJS from "exceljs";

// Interface for attendance data
interface AttendanceRecord {
  id: number;
  sessionId: number;
  studentId: number;
  studentName: string;
  registrationNumber: string;
  status: "present" | "absent" | "excused";
  timestamp: string;
  notes?: string;
}

// Interface for summary data
interface SummaryData {
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number | string;
  presentPercentage: number | string;
  absentPercentage: number | string;
  excusedPercentage: number | string;
}

// Interface for filter data
interface FilterData {
  course: string;
  unit: string;
  student: string;
  dateRange: string;
}

// Helper function to format dates
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

// Helper function to format time
function formatTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
}

// Helper function to get session details from session ID
function getSessionDetails(sessionId: number, sessions: any[]): string {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return "Unknown Session";
  
  return `${session.unitCode} - Week ${session.weekNumber} (${formatDate(session.date)})`;
}

// Export to Excel function
export async function exportToExcel(
  attendanceData: AttendanceRecord[],
  summaryData: SummaryData,
  filterData: FilterData,
  sessions: any[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "College Attendance System";
  workbook.created = new Date();
  
  // Create a worksheet for summary
  const summarySheet = workbook.addWorksheet("Summary");
  
  // Add title and report details
  summarySheet.mergeCells('A1:F1');
  summarySheet.getCell('A1').value = 'Attendance Report Summary';
  summarySheet.getCell('A1').font = { bold: true, size: 16 };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Add filter information
  summarySheet.getCell('A3').value = 'Report Filters';
  summarySheet.getCell('A3').font = { bold: true };
  
  summarySheet.getCell('A4').value = 'Course:';
  summarySheet.getCell('B4').value = filterData.course;
  
  summarySheet.getCell('A5').value = 'Unit:';
  summarySheet.getCell('B5').value = filterData.unit;
  
  summarySheet.getCell('A6').value = 'Student:';
  summarySheet.getCell('B6').value = filterData.student;
  
  summarySheet.getCell('A7').value = 'Date Range:';
  summarySheet.getCell('B7').value = filterData.dateRange;
  
  // Add summary statistics
  summarySheet.getCell('A9').value = 'Summary Statistics';
  summarySheet.getCell('A9').font = { bold: true };
  
  summarySheet.getCell('A10').value = 'Total Sessions:';
  summarySheet.getCell('B10').value = summaryData.totalSessions;
  
  summarySheet.getCell('A11').value = 'Total Students:';
  summarySheet.getCell('B11').value = summaryData.totalStudents;
  
  summarySheet.getCell('A12').value = 'Present Rate:';
  summarySheet.getCell('B12').value = `${summaryData.presentPercentage}%`;
  
  summarySheet.getCell('A13').value = 'Absent Rate:';
  summarySheet.getCell('B13').value = `${summaryData.absentPercentage}%`;
  
  summarySheet.getCell('A14').value = 'Excused Rate:';
  summarySheet.getCell('B14').value = `${summaryData.excusedPercentage}%`;
  
  // Create a worksheet for detailed records
  const detailsSheet = workbook.addWorksheet("Attendance Records");
  
  // Add headers
  detailsSheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 20 },
    { header: 'Registration Number', key: 'registrationNumber', width: 20 },
    { header: 'Session', key: 'session', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];
  
  // Style the header row
  detailsSheet.getRow(1).font = { bold: true };
  detailsSheet.getRow(1).alignment = { horizontal: 'center' };
  
  // Add data rows
  attendanceData.forEach(record => {
    detailsSheet.addRow({
      studentName: record.studentName,
      registrationNumber: record.registrationNumber,
      session: getSessionDetails(record.sessionId, sessions),
      status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
      date: formatDate(record.timestamp),
      time: formatTime(record.timestamp),
      notes: record.notes || ""
    });
  });
  
  // Set border style for all cells with data
  const borderStyle = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const }
  };
  
  // Add borders to all cells in the details sheet
  detailsSheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderStyle;
    });
  });
  
  // Generate the Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Determine filename with date
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `attendance_report_${date}.xlsx`;
  
  // Save the file
  saveAs(blob, filename);
}

// Function to generate a PDF on the server side
export async function exportToPDF(
  attendanceData: AttendanceRecord[],
  summaryData: SummaryData,
  filterData: FilterData
): Promise<void> {
  try {
    // In a real implementation, you would make a request to the server
    // for PDF generation, as client-side PDF generation with PDFKit is complex
    // due to browser limitations
    
    // Here's how you would approach it in a real app:
    
    // 1. Make a request to your server endpoint
    const response = await fetch('/api/reports/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attendanceData,
        summaryData,
        filterData
      }),
    });
    
    // 2. Check for success
    if (!response.ok) {
      throw new Error('Failed to generate PDF report');
    }
    
    // 3. Get the blob and save the file
    const blob = await response.blob();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    saveAs(blob, `attendance_report_${date}.pdf`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}