import re
import xml.etree.ElementTree as ET
from typing import Dict, Any, Tuple, Optional

def parse_gpx_content(content: str) -> Dict[str, Any]:
    try:
        root = ET.fromstring(content)
        # Strip namespaces if present
        for elem in root.iter():
            if '}' in elem.tag:
                elem.tag = elem.tag.split('}', 1)[1]

        points = []
        for pt in root.iter('trkpt'):
            lat = float(pt.attrib['lat'])
            lon = float(pt.attrib['lon'])
            points.append((lat, lon))

        if not points:
            for pt in root.iter('wpt'):
                lat = float(pt.attrib['lat'])
                lon = float(pt.attrib['lon'])
                points.append((lat, lon))

        if not points:
            raise ValueError("No GPX trackpoints or waypoints found")

        avg_lat = sum(p[0] for p in points) / len(points)
        avg_lon = sum(p[1] for p in points) / len(points)

        return {
            "success": True,
            "format": "GPX",
            "latitude": round(avg_lat, 6),
            "longitude": round(avg_lon, 6),
            "point_count": len(points),
            "message": f"Successfully parsed {len(points)} points from GPX track"
        }
    except Exception as e:
        raise ValueError(f"Invalid GPX data: {str(e)}")

def parse_kml_content(content: str) -> Dict[str, Any]:
    try:
        # Regex coordinates search
        match = re.search(r'<coordinates>([\s\S]*?)</coordinates>', content, re.IGNORECASE)
        if not match:
            raise ValueError("No <coordinates> tag found in KML")

        coord_str = match.group(1).strip()
        points = []
        for token in coord_str.split():
            parts = token.strip().split(',')
            if len(parts) >= 2:
                lon = float(parts[0])
                lat = float(parts[1])
                points.append((lat, lon))

        if not points:
            raise ValueError("No valid coordinates found in KML")

        avg_lat = sum(p[0] for p in points) / len(points)
        avg_lon = sum(p[1] for p in points) / len(points)

        return {
            "success": True,
            "format": "KML",
            "latitude": round(avg_lat, 6),
            "longitude": round(avg_lon, 6),
            "point_count": len(points),
            "message": f"Successfully parsed {len(points)} coordinate points from KML"
        }
    except Exception as e:
        raise ValueError(f"Invalid KML data: {str(e)}")

def parse_exif_gps(data: bytes) -> Dict[str, Any]:
    # Pure Python binary EXIF GPS extractor
    try:
        # Check JPEG header
        if data[:2] != b'\xff\xd8':
            raise ValueError("File is not a valid JPEG image")

        # Search for EXIF header
        exif_idx = data.find(b'Exif\x00\x00')
        if exif_idx == -1:
            raise ValueError("No EXIF metadata found in image")

        # Scan for GPS IFD tags (0x8825)
        # Search for GPS tags or pattern:
        # Let's search for standard GPS strings or markers
        gps_tag = data.find(b'GPS ')
        # Alternative search for GPS latitude ref
        # In typical geotagged images, 'N' or 'S' followed by coordinates
        # Simple extraction or raise clear message:
        # Let's parse EXIF TIFF header if possible:
        tiff_start = exif_idx + 6
        byte_order = data[tiff_start:tiff_start+2]
        is_le = (byte_order == b'II')
        endian = '<' if is_le else '>'

        import struct
        first_ifd_offset = struct.unpack(f"{endian}I", data[tiff_start+4:tiff_start+8])[0]
        curr_offset = tiff_start + first_ifd_offset
        num_entries = struct.unpack(f"{endian}H", data[curr_offset:curr_offset+2])[0]
        curr_offset += 2

        gps_ifd_offset = None
        for _ in range(min(num_entries, 100)):
            tag = struct.unpack(f"{endian}H", data[curr_offset:curr_offset+2])[0]
            val_offset = struct.unpack(f"{endian}I", data[curr_offset+8:curr_offset+12])[0]
            if tag == 0x8825:  # GPS IFD
                gps_ifd_offset = tiff_start + val_offset
                break
            curr_offset += 12

        if not gps_ifd_offset:
            raise ValueError("No GPS IFD tag found in image EXIF")

        # In GPS IFD:
        gps_entries = struct.unpack(f"{endian}H", data[gps_ifd_offset:gps_ifd_offset+2])[0]
        gps_offset = gps_ifd_offset + 2

        lat_ref = 'N'
        lon_ref = 'E'
        lat_vals = None
        lon_vals = None

        for _ in range(min(gps_entries, 50)):
            tag = struct.unpack(f"{endian}H", data[gps_offset:gps_offset+2])[0]
            tag_type = struct.unpack(f"{endian}H", data[gps_offset+2:gps_offset+4])[0]
            val_or_offset = struct.unpack(f"{endian}I", data[gps_offset+8:gps_offset+12])[0]

            if tag == 1:  # GPSLatitudeRef
                lat_ref = chr(data[gps_offset+8])
            elif tag == 3:  # GPSLongitudeRef
                lon_ref = chr(data[gps_offset+8])
            elif tag == 2:  # GPSLatitude
                # Read 3 rationals from tiff_start + val_or_offset
                pos = tiff_start + val_or_offset
                nums = [struct.unpack(f"{endian}2I", data[pos + i*8:pos + (i+1)*8]) for i in range(3)]
                lat_vals = [n[0]/n[1] if n[1] != 0 else 0 for n in nums]
            elif tag == 4:  # GPSLongitude
                pos = tiff_start + val_or_offset
                nums = [struct.unpack(f"{endian}2I", data[pos + i*8:pos + (i+1)*8]) for i in range(3)]
                lon_vals = [n[0]/n[1] if n[1] != 0 else 0 for n in nums]

            gps_offset += 12

        if not lat_vals or not lon_vals:
            raise ValueError("Geotag coordinates not fully decoded from EXIF")

        lat = lat_vals[0] + lat_vals[1]/60.0 + lat_vals[2]/3600.0
        if lat_ref.upper() == 'S':
            lat = -lat

        lon = lon_vals[0] + lon_vals[1]/60.0 + lon_vals[2]/3600.0
        if lon_ref.upper() == 'W':
            lon = -lon

        return {
            "success": True,
            "format": "EXIF JPEG",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "point_count": 1,
            "message": "Successfully extracted GPS coordinates from photo EXIF"
        }
    except Exception as e:
        raise ValueError(f"Could not extract GPS EXIF: {str(e)}")
