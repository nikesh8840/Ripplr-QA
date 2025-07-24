exports.DashboardPage = class DashboardPage {
    constructor(page) {
        this.page = page;
        this.title = page.locator('h1.dashboard-title');
    }

    async isDashboardLoaded() {
        return await this.title.isVisible();
    }
};
