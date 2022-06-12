import React, { FC } from 'react';

type Props = {
  id: string;
  inputType: string;
  label: string;
  name: string;
  placeholder: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
};

const Input: FC<Props> = ({
  id,
  inputType,
  label,
  name,
  placeholder,
  value,
  onChange,
}) => (
  <div className="form-group">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
      {label}
      <input
        className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        type={inputType}
        value={value}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
      />
    </label>
  </div>
);

export default Input;
