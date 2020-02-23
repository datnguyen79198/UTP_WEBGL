Entity = function (mesh) {
    THREE.Group.apply(this);

    //attributes
    this.mesh = mesh;
    this.mass = 1;
    this.maxSpeed = 10;
    this.position = new THREE.Vector3(0,0,0);
    this.velocity = new THREE.Vector3(0,0,0);

}

Entity.prototype = Object.assign(Object.create(THREE.Group.prototype), {
    constructor: Entity,

    update: function () {
        this.velocity.clampLength(0,this.maxSpeed);
        this.velocity.setY(0);
        this.position+=this.velocity;
    }
});

SteeringEntity = function(mesh) {
    Entity.call(this,mesh);
    this.maxForce = 5;
    this.arrivalThreshold = 400; //slowing distance
    this.steeringForce = new THREE.Vector3(0,0,0);
}

SteeringEntity.prototype = Object.assign(Object.create(Entity.prototype), {
    constructor: SteeringEntity,

    arrive: function(position /*target*/) {
        var desiredVelocity = position.clone().sub(this.position);
        desiredVelocity.normalize();
        var dist = this.position.distanceTo(position);
        if (dist > this.arrivalThreshold) {
            desiredVelocity.setLength(this.maxSpeed);
        } else {
            desiredVelocity.setLength(this.maxSpeed * dist / this.arrivalThreshold);
        }
        desiredVelocity.sub(this.velocity);
        this.steeringForce.add(desiredVelocity);
    }
});
