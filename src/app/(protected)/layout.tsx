import { UserButton } from "@clerk/nextjs";
import React from "react";
import { SidebarProvider } from "~/components/ui/sidebar";



import AppSidebar from "./app-sidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="m-2 w-full">
        <div className="flex items-center rounded-md border-sidebar-border bg-sidebar p-2 px-4 shadow">
          {/* Search Bar */}
          <div className="ml-auto"></div>
          <UserButton />
        </div>
        <div className="h-4"></div>
        {/* main component */}

        <div className="rounded-md border-sidebar-border border bg-sidebar overflow-y-scroll shadow h-[calc(100vh-6rem)] p-4">
            {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SidebarLayout;
