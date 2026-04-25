# Dashboard Site

GitHub Pages용 최소 정적 대시보드 출력 디렉토리.

## Update flow
1. Update `dashboards/system-health-dashboard.md`
2. Run `python3 scripts/build_site_dashboard.py`
3. Run `python3 scripts/deploy_public_dashboard.py`
4. GitHub Pages serves `goslowhaim/mybed_public`
