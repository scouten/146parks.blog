import 'LrFunctionContext'.postAsyncTaskWithContext("Create Starter Blog Post",
function(context)
	-- Shameless hackery.
	import 'LrFileUtils'.createAllDirectories("/Users/scouten/Desktop/146 Parks")

	local catalog = import 'LrApplication'.activeCatalog()

	-- Create starter Markdown page.

	local index = assert(io.open("/Users/scouten/Desktop/146 Parks/index.md", "w"))
	index:write("+++\n")
	index:write("title = \"(PNGH)\"\n") -- park name goes here
	index:write("date = 2021-12-25\n")
	index:write("weight = 189\n")
	index:write("\n")
	index:write("[extra]\n")
	index:write("seq = 189\n")
	index:write("lat = 46.5000\n") -- obviously wrong lat/long will stick out on map view
	index:write("lon = -128.0000\n")
	index:write("near = \"Lake Wobegon\"\n")
	index:write("markers = \"markers.js\"\n")
	index:write("track = \"track.kml\"\n")
	for _, photo in ipairs(catalog.targetPhotos) do
		if photo.isVirtualCopy then
			local pid = photo.path
			pid = pid:gsub("^.*/", "")
			pid = pid:gsub("%..*$", "")
			index:write("feature = \"" .. pid .. "\"\n")
			break
		end
	end
	index:write("+++\n")
	index:write("\n")
	index:write("(witty commentary goes here)\n")
	index:write("\n")
	for _, photo in ipairs(catalog.targetPhotos) do
		if photo.isVideo then
			local pid = photo.path
			pid = pid:gsub("^.*/", "")
			pid = pid:gsub("%..*$", "")
			index:write("{{ es_youtube(id=\"" .. pid .. "\" ytid=\"zzzzzzz\") }}\n")
		elseif not photo.isVirtualCopy then
			local pid = photo.path
			pid = pid:gsub("^.*/", "")
			pid = pid:gsub("%..*$", "")
			index:write("{{ es_image(id=\"" .. pid .. "\") }}\n")
		end
	end
	
	index:write("\n")
	index:write("For more information:\n")
	index:write("\n")
	index:write("* [State parks web site](https://parks.state.wa.us/404/LostLake)\n")
	index:close()

	-- Create markers.js file to place photos on page.

	local markers = assert(io.open("/Users/scouten/Desktop/146 Parks/markers.js", "w"))

	markers:write("function addGpxMarkers(map) {\n")
	markers:write("    return [\n")

	for _, photo in ipairs(catalog.targetPhotos) do
		if not photo.isVirtualCopy then

			local pid = photo.path
			pid = pid:gsub("^.*/", "")
			pid = pid:gsub("%..*$", "")

			local gps = photo:getRawMetadata("gps") or {}
			local lat = gps.latitude
			local lon = gps.longitude

			if lat and lon then
				lat = string.format("%.6f", lat)
				lon = string.format("%.6f", lon)
				markers:write('        addGpxMarker(map, "' .. pid .. '", ' .. lat .. ', ' .. lon .. '),\n')
			end
		end
	end

	markers:write("    ]\n")
	markers:write("}\n")
	markers:close()
end)
