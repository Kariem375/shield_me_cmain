// ==========================================
// 1. SYSTEM TEST RULE
// ==========================================
rule Test_Malware_Rule 
{
    meta:
        description = "Basic rule to verify the Shield Me engine is running"
    strings:
        $test_string = "MALWARE_TEST_STRING" nocase ascii wide
    condition:
        $test_string
}

// ==========================================
// 2. MALICIOUS DOCUMENTS (PDF & OFFICE)
// ==========================================
rule Suspicious_PDF_With_JS 
{
    meta:
        description = "Detects PDF files with hidden JavaScript"
    strings:
        $pdf_magic = { 25 50 44 46 } 
        $js = "/JavaScript" nocase
        $action = "/OpenAction" nocase
    condition:
        $pdf_magic at 0 and $js and $action
}

rule Suspicious_PDF_External_Launch 
{
    meta:
        description = "Detects PDF files trying to open external programs"
    strings:
        $pdf_magic = { 25 50 44 46 } 
        $launch = "/Launch" nocase
        $cmd = "cmd.exe" nocase
    condition:
        $pdf_magic at 0 and $launch and $cmd
}

rule Malicious_Office_Macro 
{
    meta:
        description = "Detects dangerous VBA macros in Office files"
    strings:
        $sus1 = "AutoOpen" nocase
        $sus2 = "Document_Open" nocase
        $cmd1 = "WScript.Shell" nocase
        $cmd2 = "powershell.exe" nocase
    condition:
        any of ($sus*) and any of ($cmd*)
}

// ==========================================
// 3. WEB SERVER THREATS (WEB SHELLS)
// ==========================================
rule PHP_WebShell_Commands 
{
    meta:
        description = "Detects hackers trying to run terminal commands via PHP"
    strings:
        $php = "<?php" nocase
        $evil1 = "eval($_" nocase
        $evil2 = "system($_" nocase
        $evil3 = "shell_exec(" nocase
    condition:
        $php and any of ($evil*)
}

rule ASP_WebShell_Uploader 
{
    meta:
        description = "Detects Windows Server ASP uploaders"
    strings:
        $asp = "<%@" nocase
        $up1 = "Scripting.FileSystemObject" nocase
        $up2 = "SaveToFile" nocase
    condition:
        $asp and all of ($up*)
}

// ==========================================
// 4. WINDOWS EXECUTABLES (VIRUSES/TROJANS)
// ==========================================
rule Ransomware_ShadowCopy_Deletion 
{
    meta:
        description = "Detects ransomware destroying Windows backups"
    strings:
        $cmd1 = "vssadmin" nocase ascii wide
        $cmd2 = "delete shadows" nocase ascii wide
        $cmd3 = "/all" nocase ascii wide
        $cmd4 = "/quiet" nocase ascii wide
    condition:
        all of ($cmd*)
}

rule Windows_Keylogger_API 
{
    meta:
        description = "Detects software recording keyboard strokes"
    strings:
        $api1 = "SetWindowsHookEx" ascii fullword
        $api2 = "GetAsyncKeyState" ascii fullword
        $api3 = "GetKeyboardState" ascii fullword
    condition:
        2 of ($api*)
}

rule Suspicious_Memory_Injection 
{
    meta:
        description = "Detects malware hiding inside other safe programs"
    strings:
        $api1 = "VirtualAlloc" ascii fullword
        $api2 = "CreateRemoteThread" ascii fullword
        $api3 = "WriteProcessMemory" ascii fullword
    condition:
        2 of ($api*)
}

rule InfoStealer_Browser_Data 
{
    meta:
        description = "Detects malware trying to steal saved browser passwords"
    strings:
        $sql = "sqlite3" nocase ascii wide
        $path1 = "Google\\Chrome\\User Data\\Default\\Login Data" nocase ascii wide
        $path2 = "Mozilla\\Firefox\\Profiles" nocase ascii wide
    condition:
        $sql and any of ($path*)
}

// ==========================================
// 5. DANGEROUS SCRIPTS (POWERSHELL/BAT)
// ==========================================
rule Hidden_PowerShell_Execution 
{
    meta:
        description = "Detects hidden, bypassed PowerShell execution"
    strings:
        $ps = "powershell" nocase ascii wide
        $arg1 = "-ExecutionPolicy Bypass" nocase ascii wide
        $arg2 = "-ep bypass" nocase ascii wide
        $arg3 = "-WindowStyle Hidden" nocase ascii wide
        $arg4 = "-w hidden" nocase ascii wide
    condition:
        $ps and (any of ($arg1, $arg2)) and (any of ($arg3, $arg4))
}