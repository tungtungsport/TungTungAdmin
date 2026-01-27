"use client";

import { useState, useMemo } from "react";
import { Filter, Calendar } from "lucide-react";

export type FilterPeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'specific_month' | 'specific_date';

export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

interface DateFilterProps {
    filterPeriod: FilterPeriod;
    setFilterPeriod: (period: FilterPeriod) => void;
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    showAllOption?: boolean;
}

export function DateFilter({
    filterPeriod,
    setFilterPeriod,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedDate,
    setSelectedDate,
    showAllOption = true
}: DateFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#7CFF9B]" />
                <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                    className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                >
                    {showAllOption && <option value="all">Semua Waktu</option>}
                    <option value="daily">Hari Ini</option>
                    <option value="weekly">Minggu Ini</option>
                    <option value="monthly">Bulan Ini</option>
                    <option value="yearly">Tahun Ini</option>
                    <option value="specific_month">Pilih Bulan</option>
                    <option value="specific_date">Pilih Tanggal</option>
                </select>
            </div>

            {filterPeriod === 'specific_month' && (
                <div className="flex items-center gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                    >
                        {MONTHS.map((month, idx) => (
                            <option key={idx} value={idx}>{month}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                    >
                        {[2024, 2025, 2026].map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            )}

            {filterPeriod === 'specific_date' && (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#BFD3C6]" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-[#0A1A13] border border-[#1A4D35] text-white text-sm px-3 py-2 rounded focus:border-[#7CFF9B] outline-none"
                    />
                </div>
            )}
        </div>
    );
}

export function useDateFilter(defaultPeriod: FilterPeriod = 'all') {
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>(defaultPeriod);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const getDateRange = useMemo(() => {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (filterPeriod) {
            case 'all':
                return { startDate: null, endDate: null };
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'weekly':
                const dayOfWeek = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;
            case 'specific_month':
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
                break;
            case 'specific_date':
                const date = new Date(selectedDate);
                startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
                break;
        }

        return {
            startDate: startDate?.toISOString() || null,
            endDate: endDate?.toISOString() || null
        };
    }, [filterPeriod, selectedMonth, selectedYear, selectedDate]);

    return {
        filterPeriod,
        setFilterPeriod,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        selectedDate,
        setSelectedDate,
        getDateRange
    };
}
