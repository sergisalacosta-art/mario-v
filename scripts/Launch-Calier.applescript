on run
  do shell script "cd " & quoted form of POSIX path of ((path to me as text) & "::") & " && nohup ./Launch-Calier.command >/dev/null 2>&1 &"
end run
