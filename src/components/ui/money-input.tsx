"use client";

import { NumericFormat } from "react-number-format";

const ZERO_DECIMAL_CURRENCIES = ["UGX", "KES", "TZS", "RWF"];

type MoneyInputProps = {
  value: number;
  onChange: (value: number) => void;
  currency: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
};

export function MoneyInput({
  value,
  onChange,
  currency,
  className,
  placeholder,
  disabled,
  required,
  id,
  name,
}: MoneyInputProps) {
  const decimalScale = ZERO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2;
  return (
    <NumericFormat
      value={value}
      onValueChange={({ floatValue }) => onChange(floatValue ?? 0)}
      thousandSeparator=","
      decimalScale={decimalScale}
      fixedDecimalScale={false}
      allowNegative={false}
      inputMode="decimal"
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      id={id}
      name={name}
      className={className}
    />
  );
}
