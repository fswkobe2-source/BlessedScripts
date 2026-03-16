; Blessed Scripts Installer Script
; Custom NSIS script for Blessed Scripts Launcher

!macro customInstall
  ; Create registry entries for Blessed Scripts
  WriteRegStr HKCU "Software\Blessed Scripts" "" "$INSTDIR"
  WriteRegStr HKCU "Software\Blessed Scripts" "Version" "${VERSION}"
  WriteRegStr HKCU "Software\Blessed Scripts" "InstallDate" "${__DATE__}"
  
  ; Set custom colors for installer (if supported)
  ; These will be applied during installation
!macroend

!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey HKCU "Software\Blessed Scripts"
!macroend
