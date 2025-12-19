# Changelog

All notable changes to this project will be documented in this file.



## [0.2.1] - 2025-12-18

- No-Symbol-As-First-Char swapout rule causing symbol accumulation in final character
  - Dropping swapper, adding generator parent that loops until non violator is generated naturally
- Changed to using cryptographic random for better randomization and less serialization attack surface
- Hardened headers for better industry standard security settings
- Added button to clear history to provide better password protection (auto-clear under consideration)


## [0.2.0] - 2025-12-16

### Added
- User-configurable password generation settings (length, character requirements, symbol charset)
- Settings persistence using localStorage
- Pull-out left-side drawer for configuration interface

## [0.1.0] - 2025-12-14

### Added
- Initial project setup with Next.js 15 and React 19
