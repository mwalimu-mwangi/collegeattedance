import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface AttendanceRecordProps {
  unitName: string;
  courseCode: string;
  date: Date;
  time: {
    start: string;
    end: string;
  };
  attendance: {
    present: number;
    total: number;
    percentage: number;
  };
  recordOfWork: "completed" | "pending";
  onView: () => void;
}

export function AttendanceTable({ records }: { records: AttendanceRecordProps[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Unit
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Attendance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Record of Work
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{record.unitName}</div>
                      <div className="text-xs text-slate-500">{record.courseCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {format(record.date, "PP")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {record.time.start} - {record.time.end}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-slate-900">
                        {record.attendance.present}/{record.attendance.total}
                      </div>
                      <span className={`ml-2 text-xs font-medium ${
                        record.attendance.percentage >= 85
                          ? "text-green-800 bg-green-100"
                          : record.attendance.percentage >= 70
                          ? "text-amber-800 bg-amber-100"
                          : "text-red-800 bg-red-100"
                      } px-2 py-0.5 rounded-full`}>
                        {record.attendance.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {record.recordOfWork === "completed" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <span className="mr-1">✓</span>
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        <span className="mr-1">⚠</span>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Button
                      variant="link"
                      className="text-primary-800 hover:text-primary-900 p-0"
                      onClick={record.onView}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
        <Button variant="outline" size="sm" className="mr-2">
          Previous
        </Button>
        <Button size="sm" className="bg-primary-800 hover:bg-primary-900">
          Next
        </Button>
      </div>
    </div>
  );
}
