import { Pipe, PipeTransform } from '@angular/core';

/** Formats large numbers compactly: 1234 -> "1.2k", 2_500_000 -> "2.5M". */
@Pipe({ name: 'compactNumber' })
export class CompactNumberPipe implements PipeTransform {
  private readonly fmt = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '0';
    return this.fmt.format(value);
  }
}
