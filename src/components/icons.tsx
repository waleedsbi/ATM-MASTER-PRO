import type { SVGProps } from 'react';

export function AtmProLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <g fill="currentColor">
        <path
          d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
        />
        <path
          d="M168 92h-18.33l-16-40a8 8 0 1 0-15.34 6.14L132.33 92H104a8 8 0 0 0 0 16h24.59l-7.27 18.18a8 8 0 0 0 5.36 10.64a7.79 7.79 0 0 0 2.73.58a8 8 0 0 0 7.89-6.6l7.27-18.18H168a8 8 0 0 0 0-16Zm-48 72a8 8 0 0 0-8-8H96v-16a8 8 0 0 0-16 0v16H64a8 8 0 0 0 0 16h16v16a8 8 0 0 0 16 0v-16h16a8 8 0 0 0 8-8Zm104 0h-48a8 8 0 0 0 0 16h48a8 8 0 0 0 0-16Z"
        />
      </g>
    </svg>
  );
}
