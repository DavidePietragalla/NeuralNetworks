for
  file in $(find src / lib - type f \(-name "*.svelte" - o - name "*.ts" \));
do
  echo - e "\n=== $file ===";
cat "$file";
done
