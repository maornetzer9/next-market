import React from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

import { getCatalogPageRange, getCatalogPageWindow } from "../../utils/catalogPagination";

/**
 * Premium catalog pagination rail — shared surface, coral active marker.
 * @param {{
 *   currentPage: number,
 *   totalPages: number,
 *   totalItems: number,
 *   pageSize: number,
 *   onPageChange: (page: number) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function CatalogPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1 || totalItems <= 0) return null;

  const pageWindow = getCatalogPageWindow(currentPage, totalPages);
  const range = getCatalogPageRange(currentPage, totalItems, pageSize);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav className="catalog-pagination" aria-label="Catalog pages">
      <p className="catalog-pagination__summary b25-tabular" aria-live="polite">
        Showing <span>{range.start}–{range.end}</span> of {range.total}
      </p>

      <div className={`catalog-pagination__rail${disabled ? " is-busy" : ""}`}>
        <button
          type="button"
          className="catalog-pagination__nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || isFirstPage}
          aria-label="Previous page"
        >
          <MdChevronLeft aria-hidden="true" />
          <span className="catalog-pagination__nav-label">Previous</span>
        </button>

        <div className="catalog-pagination__pages">
          {pageWindow.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="catalog-pagination__ellipsis"
                  aria-hidden="true"
                >
                  ···
                </span>
              );
            }

            const isCurrent = item === currentPage;
            return (
              <button
                key={item}
                type="button"
                className={`catalog-pagination__page${isCurrent ? " is-current" : ""}`}
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Go to page ${item}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className="catalog-pagination__page-label">{item}</span>
              </button>
            );
          })}
        </div>

        <p className="catalog-pagination__mobile-status b25-tabular" aria-hidden="true">
          Page {currentPage} / {totalPages}
        </p>

        <button
          type="button"
          className="catalog-pagination__nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || isLastPage}
          aria-label="Next page"
        >
          <span className="catalog-pagination__nav-label">Next</span>
          <MdChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
