-- Get the filename of the active Microsoft Word document (without extension)
-- and copy it to the clipboard

tell application "Microsoft Word"
    try
        if (count of documents) > 0 then
            set docName to name of active document
            -- Remove file extension
            set AppleScript's text item delimiters to "."
            set nameItems to text items of docName
            if (count of nameItems) > 1 then
                set nameWithoutExt to (items 1 thru -2 of nameItems) as text
            else
                set nameWithoutExt to docName
            end if
            set AppleScript's text item delimiters to ""
            set the clipboard to nameWithoutExt
        end if
    end try
end tell
