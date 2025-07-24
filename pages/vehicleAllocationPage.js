exports.VehicleAllocationPage = class VehicleAllocationPage {
    constructor(page) {
        this.page = page;
        this.allocateBtn = page.locator('#allocate');
        this.vehicleDropdown = page.locator('#vehicle');
    }

    async allocateVehicle(vehicleName) {
        await this.vehicleDropdown.selectOption(vehicleName);
        await this.allocateBtn.click();
    }
};
