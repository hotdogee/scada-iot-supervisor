# Database backup and restore

```powershell
.\mongodump.exe --db scada-iot --out scada-iot-demo --gzip
```

```bash
mongodump --db scada-iot --out scada-iot-demo --gzip
mongorestore --gzip --db scada-iot scada-iot-demo/scada-iot
```
