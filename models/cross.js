var CrossTenant = {
    Empty:1,
    Red:2,
    Green:3,
    Border:4
};

function Cross(){
    this.tenant = CrossTenant.Empty;
};

exports.cross = Cross;
exports.cross_tenant = CrossTenant;
