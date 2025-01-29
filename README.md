# Deforestation Trends in Amazon


This project examines forest loss trends along Brazil’s entire Amazonian border, focusing on a 27 km buffer zone inside and outside the border where Brazil shares boundaries with neighboring countries. The Global Forest Change dataset (Hansen et al., 2023) is used to extract forest cover in 2000, annual deforestation, and forest gain. The deforestation layer is segmented into three key periods: 2001–2005 (Pre-conservation policies), 2006–2013 (Strict conservation policies), 2014–2020 (Policy relaxation)

# Data Processing in GEE
The dataset is clipped to the Amazon Basin (from MapBiomas) and masked to show only areas where deforestation or forest gain occurred. The lossyear band is used to extract deforestation trends for the three time intervals. Given the large dataset size, tiled exports are created in 30m resolution and saved to Google Drive for further analysis in QGIS.

# Post-processing in QGIS
In QGIS, the exported tiles are stitched together to create continuous maps of deforestation. Additional layers such as water bodies, roads, elevation, protected areas, and Indigenous territories are integrated to analyze spatial variations and assess differential deforestation trends.

# Purpose and Analysis
The processed data is exploited to develop a regression discontinuity design (RDD), intended to evaluates how national conservation policies impact deforestation by comparing trends across the border. This approach helps determine the effectiveness of Brazil’s policy shifts over time, highlighting the role of governance in Amazon conservation. By limiting the analysis at the border, the design helps us account for endogneity. 







