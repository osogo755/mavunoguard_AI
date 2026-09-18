import unittest
from server.services.risk_engine import calculate_deterministic_risk
from server.services.satellite import interpret_ndvi
from server.services.geo_importer import parse_gpx_content, parse_kml_content

class TestMavunoGuardServices(unittest.TestCase):

    def test_deterministic_risk_drought(self):
        # Drought conditions: very low rainfall, high temp, dry soil observation
        weather = {
            "rainfall_7d": 1.2,
            "rainfall_14d": 5.0,
            "temp_max": 33.5,
            "precip_prob": 10.0,
            "soil_moisture": 0.10
        }
        farm = {
            "soil_type": "sandy",
            "drainage": "good",
            "flood_history": "never",
            "crop_health": "fair"
        }
        observations = ["dry soil", "wilting"]
        res = calculate_deterministic_risk(weather, farm, observations, {})

        self.assertGreaterEqual(res["drought_risk"], 50)
        self.assertIn(res["risk_level"], ["MODERATE-HIGH", "HIGH"])
        self.assertTrue(any("dry spell" in r.lower() or "rainfall" in r.lower() for r in res["reasons"]))
        self.assertTrue(len(res["recommended_actions"]) > 0)

    def test_deterministic_risk_flood(self):
        # Flood conditions: heavy rain, poor drainage, waterlogging
        weather = {
            "rainfall_7d": 95.0,
            "rainfall_14d": 160.0,
            "temp_max": 22.0,
            "precip_prob": 90.0
        }
        farm = {
            "soil_type": "clay",
            "drainage": "poor",
            "flood_history": "frequent",
            "slope": "flat",
            "crop_health": "fair"
        }
        observations = ["waterlogging"]
        res = calculate_deterministic_risk(weather, farm, observations, {})

        self.assertGreaterEqual(res["flood_risk"], 50)
        self.assertIn(res["risk_level"], ["MODERATE-HIGH", "HIGH"])
        self.assertTrue(any("drainage" in a.lower() or "trench" in a.lower() for a in res["recommended_actions"]))

    def test_ndvi_interpretation(self):
        self.assertIn("Low", interpret_ndvi(0.15))
        self.assertIn("Moderate", interpret_ndvi(0.35))
        self.assertIn("Strong", interpret_ndvi(0.65))
        self.assertEqual(interpret_ndvi(None), "Not available")

    def test_gpx_parsing(self):
        gpx_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1" creator="Garmin">
            <trk>
                <trkseg>
                    <trkpt lat="-0.4167" lon="36.9500"></trkpt>
                    <trkpt lat="-0.4170" lon="36.9510"></trkpt>
                </trkseg>
            </trk>
        </gpx>"""
        res = parse_gpx_content(gpx_xml)
        self.assertTrue(res["success"])
        self.assertEqual(res["format"], "GPX")
        self.assertAlmostEqual(res["latitude"], -0.41685, places=4)
        self.assertEqual(res["point_count"], 2)

    def test_kml_parsing(self):
        kml_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
            <Placemark>
                <name>Farm Boundary</name>
                <Polygon>
                    <outerBoundaryIs>
                        <LinearRing>
                            <coordinates>
                                36.9500,-0.4167,0 36.9520,-0.4167,0 36.9520,-0.4180,0
                            </coordinates>
                        </LinearRing>
                    </outerBoundaryIs>
                </Polygon>
            </Placemark>
        </kml>"""
        res = parse_kml_content(kml_xml)
        self.assertTrue(res["success"])
        self.assertEqual(res["format"], "KML")
        self.assertAlmostEqual(res["latitude"], -0.4171, places=3)
        self.assertEqual(res["point_count"], 3)

    def test_invalid_kml_error(self):
        with self.assertRaises(ValueError):
            parse_kml_content("<kml></kml>")

if __name__ == '__main__':
    unittest.main()
