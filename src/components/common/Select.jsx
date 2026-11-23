import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    placeholder = 'Pilih opsi...',
    error,
    required = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 bg-white transition-colors focus:outline-none focus:ring-4 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-slate-300 focus:border-royal-600 focus:ring-royal-600/15'
        } disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});

export default Select;