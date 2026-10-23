#!/usr/bin/env python3
"""Regenerate the planet table embedded in electional-astrology.html.

Usage:
    pip install ephem
    python3 gen_ephemeris.py 2026-01-01 2028-12-31 > ephem_table.js

Prints a JavaScript snippet (var EPHEM = {...}) holding daily 00:00 UTC
geocentric ecliptic longitudes (tropical, of date) for Mercury..Saturn, in
hundredths of a degree. The table starts 5 days before the start date and
ends 5 days after the end date so the page can interpolate near the edges.
Run this once a year to extend the supported range, then paste the output
over the existing EPHEM block in electional-astrology.html.
"""
import math
import sys
from datetime import date, datetime, timedelta, timezone

import ephem

BODIES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"]


def lon_deg(body_name, dt):
    d = ephem.Date(dt.strftime("%Y/%m/%d %H:%M:%S"))
    body = getattr(ephem, body_name)()
    body.compute(d)
    return math.degrees(float(ephem.Ecliptic(body, epoch=d).lon)) % 360.0


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    first = date.fromisoformat(sys.argv[1]) - timedelta(days=5)
    last = date.fromisoformat(sys.argv[2]) + timedelta(days=5)
    days = (last - first).days + 1
    data = {}
    for name in BODIES:
        vals = []
        for i in range(days):
            dt = datetime(first.year, first.month, first.day, tzinfo=timezone.utc) + timedelta(days=i)
            vals.append(str(int(round(lon_deg(name, dt) * 100))))
        data[name] = " ".join(vals)
    print("var EPHEM = {")
    print("  start: '%s', days: %d, unit: 0.01," % (first.isoformat(), days))
    print("  supportedFrom: '%s', supportedTo: '%s'," % (sys.argv[1], sys.argv[2]))
    print("  data: {")
    for i, name in enumerate(BODIES):
        print("    %s: '%s'%s" % (name, data[name], "," if i < len(BODIES) - 1 else ""))
    print("  }")
    print("};")


if __name__ == "__main__":
    main()
