import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemData {
  label: string;
  path?: string; // jeśli nie ma path, to jest to aktualna strona
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItemData[];
  className?: string;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ items, className = "" }) => {
  const navigate = useNavigate();

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.path ? (
                <BreadcrumbLink 
                  onClick={() => navigate(item.path)}
                  className="text-white/70 hover:text-white cursor-pointer transition-colors"
                >
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-white font-medium">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator className="text-white/50" />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNavigation;
