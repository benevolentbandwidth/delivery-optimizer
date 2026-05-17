"use client";

import {
  MOBILE_PAGINATION_ROOT,
  MOBILE_PAGINATION_PILLS_ROW,
  MOBILE_PAGINATION_PAGE_ACTIVE,
  MOBILE_PAGINATION_PAGE_INACTIVE,
  MOBILE_PAGINATION_NAV_ROW,
  PAGINATION_V2_SHOW_CONTAINER,
  PAGINATION_V2_SHOW_TEXT,
  PAGINATION_V2_SHOW_CHEVRON,
  PAGINATION_V2_SHOW_CHEVRON_ICON,
  PAGINATION_V2_SHOW_SELECT,
  PAGINATION_V2_NAV_CONTAINER,
  PAGINATION_V2_NAV_BTN,
  PAGINATION_V2_NAV_BTN_DISABLED,
} from "../formStyles.v2";
import { ADDRESS_PAGE_SIZE_OPTIONS } from "../hooks/useAddresses";

type AddressPaginationMobileProps = {
  addressPage: number;
  setAddressPage: (page: number) => void;
  totalAddressPages: number;
  addressesPerPage: number;
  setAddressesPerPage: (n: number) => void;
  addressesCount: number;
};

function getVisiblePages(current: number, total: number): number[] {
  if (total === 0) return [];
  const count = Math.min(total, 5);
  const start = Math.max(1, Math.min(current - 2, total - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
}

export default function AddressPaginationMobile({
  addressPage,
  setAddressPage,
  totalAddressPages,
  addressesPerPage,
  setAddressesPerPage,
  addressesCount,
}: AddressPaginationMobileProps) {
  if (addressesCount === 0) return null;

  const isFirst = addressPage <= 1;
  const isLast = addressPage >= totalAddressPages;
  const visiblePages = getVisiblePages(addressPage, totalAddressPages);

  return (
    <div className={MOBILE_PAGINATION_ROOT}>
      {/* Row 1: page pills */}
      <div className={MOBILE_PAGINATION_PILLS_ROW}>
        {visiblePages.map((n) =>
          n === addressPage ? (
            <span key={n} className={MOBILE_PAGINATION_PAGE_ACTIVE} aria-current="page">
              {n}
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => setAddressPage(n)}
              className={MOBILE_PAGINATION_PAGE_INACTIVE}
              aria-label={`Page ${n}`}
            >
              {n}
            </button>
          )
        )}
      </div>

      {/* Row 2: Show N dropdown + nav buttons */}
      <div className={MOBILE_PAGINATION_NAV_ROW}>
        <label className={PAGINATION_V2_SHOW_CONTAINER}>
          <span className={PAGINATION_V2_SHOW_TEXT}>Show {addressesPerPage}</span>
          <span className={PAGINATION_V2_SHOW_CHEVRON}>
            <svg
              width="8"
              height="12"
              viewBox="0 0 8 12"
              fill="none"
              className={PAGINATION_V2_SHOW_CHEVRON_ICON}
            >
              <path
                d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z"
                fill="var(--edit-primary-icon)"
              />
            </svg>
          </span>
          <select
            className={PAGINATION_V2_SHOW_SELECT}
            value={addressesPerPage}
            onChange={(e) => setAddressesPerPage(Number(e.target.value))}
            aria-label="Addresses per page"
          >
            {ADDRESS_PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className={PAGINATION_V2_NAV_CONTAINER}>
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setAddressPage(1)}
            className={isFirst ? PAGINATION_V2_NAV_BTN_DISABLED : PAGINATION_V2_NAV_BTN}
            aria-label="First page"
          >
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
              <path
                d="M2 0H0V12H2V0ZM12.4 1.4L11 0L5 6L11 12L12.4 10.6L7.8 6L12.4 1.4Z"
                fill="var(--edit-primary-icon)"
              />
            </svg>
          </button>

          <button
            type="button"
            disabled={isFirst}
            onClick={() => setAddressPage(addressPage - 1)}
            className={isFirst ? PAGINATION_V2_NAV_BTN_DISABLED : PAGINATION_V2_NAV_BTN}
            aria-label="Previous page"
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path
                d="M2.7999 6L7.3999 10.6L5.9999 12L-9.77516e-05 6L5.9999 0L7.3999 1.4L2.7999 6Z"
                fill="var(--edit-primary-icon)"
              />
            </svg>
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={() => setAddressPage(addressPage + 1)}
            className={isLast ? PAGINATION_V2_NAV_BTN_DISABLED : PAGINATION_V2_NAV_BTN}
            aria-label="Next page"
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path
                d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z"
                fill="var(--edit-primary-icon)"
              />
            </svg>
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={() => setAddressPage(totalAddressPages)}
            className={isLast ? PAGINATION_V2_NAV_BTN_DISABLED : PAGINATION_V2_NAV_BTN}
            aria-label="Last page"
          >
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
              <path
                d="M10.3999 0H12.3999V12H10.3999V0ZM-9.82285e-05 1.4L1.3999 0L7.3999 6L1.3999 12L-9.82285e-05 10.6L4.5999 6L-9.82285e-05 1.4Z"
                fill="var(--edit-primary-icon)"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
