const airports = {
    "IRFD": {
        "name": "Rockford",
        "runways": ["25L", "25C", "25R", "7L", "7C", "7R"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Rockford/Greater%20Rockford",
        "frequency": {
            "DEL": 119.250,
            "GND": 120.400,
            "TWR": 118.100,
            "APP": 119.300,
            "CTR": 124.850
        },
    },
    "IMLR": {
        "name": "Mellor",
        "runways": ["25", "7"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Rockford/Mellor",
        "frequency": {
            "DEL": 121.930,
            "GND": null,
            "TWR": 133.850,
            "APP": 125.650,
            "CTR": null
        }
    },
    "IGAR": {
        "name": "Garry",
        "runways": ["22", "4"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Rockford/Air%20Base%20Garry",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 125.600,
            "APP": null,
            "CTR": null
        }
    },
    "IBLT": {
        "name": "Boltic",
        "runways": ["19", "1"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Rockford/Boltic%20Airfield",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 120.250,
            "APP": null,
            "CTR": null
        }
    },
    "ILAR": {
        "name": "Larnaca",
        "runways": ["6", "27"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Cyprus/Larnaca",
        "frequency": {
            "DEL": 120.575,
            "GND": 119.400,
            "TWR": 121.200,
            "APP": 130.200,
            "CTR": 126.300
        }
    },
    "IPAP": {
        "name": "Paphos",
        "runways": ["17", "35"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Cyprus/Paphos",
        "frequency": {
            "DEL": null,
            "GND": 120.800,
            "TWR": 119.900,
            "APP": 130.625,
            "CTR": null
        }
    },
    "IIAB": {
        "name": "McConnell",
        "runways": ["9", "27"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Cyprus/McConnell",
        "frequency": {
            "DEL": null,
            "GND": 118.000,
            "TWR": 127.250,
            "APP": 130.200,
            "CTR": null
        }
    },
    "IHEN": {
        "name": "Henstridge",
        "runways": ["17", "35"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Cyprus/Henstridge",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 130.250,
            "APP": null,
            "CTR": null
        }
    },
    "IBAR": {
        "name": "Barra",
        "runways": ["n/a"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Cyprus/Barra",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 118.750,
            "APP": null,
            "CTR": null
        }
    },
    "IZOL": {
        "name": "Izolirani",
        "runways": ["10", "28"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Izolirani/Izolirani",
        "frequency": {
            "DEL": 128.200,
            "GND": 121.900,
            "TWR": 118.700,
            "APP": 124.300,
            "CTR": 124.650
        }
    },
    "IJAF": {
        "name": "Al Najaf",
        "runways": ["7", "25"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Izolirani/AL%20Najaf",
        "frequency": {
            "DEL": null,
            "GND": 121.700,
            "TWR": 119.100,
            "APP": 120.200,
            "CTR": null
        }
    },
    "ISCM": {
        "name": "RAF Scampton",
        "runways": ["13", "31"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Izolirani/RAF%20Scampton",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 121.300,
            "APP": null,
            "CTR": null
        }
    },
    "ITKO": {
        "name": "Tokyo",
        "runways": ["13", "31", "20", "2"],
        "noLanding": ["2"],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Orenji/Tokyo",
        "frequency": {
            "DEL": 121.825,
            "GND": 118.225,
            "TWR": 118.800,
            "APP": 119.100,
            "CTR": 132.300
        }
    },
    "IDCS": {
        "name": "Saba",
        "runways": ["7", "25"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Orenji/Saba",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 118.250,
            "APP": null,
            "CTR": null
        }
    },
    "IPPH": {
        "name": "Perth",
        "runways": ["15", "33", "11", "29"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Perth/Perth",
        "frequency": {
            "DEL": 118.550,
            "GND": 121.700,
            "TWR": 127.400,
            "APP": 118.700,
            "CTR": 135.250
        }
    },
    "ILKL": {
        "name": "Lukla",
        "runways": ["09", "27"],
        "noLanding": ["09"],
        "noTakeoff": ["27"],
        "canUseOpposite": true,
        "ChartsLinkPath": "Perth/Lukla",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 120.150,
            "APP": null,
            "CTR": null
        }
    },
    "IBTH": {
        "name": "Saint Barthélemy",
        "runways": ["09", "27"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Saint%20Barthelemy/Saint%20Barthelemy",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 118.700,
            "APP": null,
            "CTR": 128.600
        }
    },
    "ISKP": {
        "name": "Skopelos",
        "runways": ["5", "23"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Skopelos/Skopelos%20Airfield",
        "frequency": {
            "DEL": null,
            "GND": null,
            "TWR": 123.250,
            "APP": null,
            "CTR": null
        }
    },
    "IGRV": {
        "name": "Grindavik",
        "runways": ["6", "24"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Grindavik/Grindavik",
        "frequency": {
            "DEL": null,
            "GND": 121.900,
            "TWR": 118.300,
            "APP": null,
            "CTR": 126.750
        }
    },
    "ISAU": {
        "name": "Sauthamptona",
        "runways": ["8", "26"],
        "noLanding": [],
        "noTakeoff": [],
        "canUseOpposite": false,
        "ChartsLinkPath": "Sauthemptona/Sauthemptona",
        "frequency": {
            "DEL": null,
            "GND": 130.880,
            "TWR": 118.200,
            "APP": 122.730,
            "CTR": 127.825
        }
    }
}
export default airports;