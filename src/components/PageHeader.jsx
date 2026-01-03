
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageHeader({ title, subtitle, children, buttonText, onButtonClick }) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold gradient-text">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm lg:text-base" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        
        {(children || buttonText) && (
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {buttonText && (
              <Button
                onClick={onButtonClick}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg order-last sm:order-first"
              >
                <Plus className="w-4 h-4 mr-2" />
                {buttonText}
              </Button>
            )}
            {children && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
