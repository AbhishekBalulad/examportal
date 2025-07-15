
import React from "react";
import { DepartmentManager } from "@/components/department/DepartmentManager";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Department = () => {
  return (
    <DashboardLayout>
      <DepartmentManager />
    </DashboardLayout>
  );
};

export default Department;
