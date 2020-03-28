Entity = function (mesh) {
    THREE.Group.apply(this);

    //attributes
    this.mesh = mesh;
    this.mass = 1;
    this.maxSpeed = 0.1;
    this.boundingRadius = 0;
    this.position = new THREE.Vector3(0,0,0);
    this.velocity = new THREE.Vector3(0,0,0);
    this.velocitySamples = []
    this.numSamplesForSmoothing = 20

    this.add(this.mesh);

}

Entity.prototype = Object.assign(Object.create(THREE.Group.prototype), {
    constructor: Entity,

    lookWhereGoing: function () {
        var direction = this.position.clone().add(this.velocity).setY(this.position.y)
        if (this.velocitySamples.length == this.numSamplesForSmoothing) {
            this.velocitySamples.shift();
        }

        this.velocitySamples.push(this.velocity.clone().setY(this.position.y));
        direction.set(0, 0, 0);
        for (var v = 0; v < this.velocitySamples.length; v++) {
            direction.add(this.velocitySamples[v])
        }
        direction.divideScalar(this.velocitySamples.length)
        direction = this.position.clone().add(direction).setY(this.position.y)
        this.lookAt(direction)
    },

    update: function () {
        this.velocity.clampLength(0,this.maxSpeed);
        this.velocity.setY(0);
        this.position.add(this.velocity); //physical movement
        //console.log(this.velocity);
    }
});

SteeringEntity = function(mesh) {
    Entity.call(this,mesh);
    this.maxForce = 1;
    this.arrivalThreshold = 200; //slowing distance
    this.avoidDistance = 100;
    this.steeringForce = new THREE.Vector3(0,0,0);
}

SteeringEntity.prototype = Object.assign(Object.create(Entity.prototype), {
    constructor: SteeringEntity,

    seek: function (position) {
        var desiredVelocity = position.clone().sub(this.position);
        desiredVelocity.normalize().setLength(this.maxSpeed).sub(this.velocity);
        this.steeringForce.add(desiredVelocity);
    },

    arrive: function(position /*target*/) {
        var desiredVelocity = position.clone().sub(this.position);
        desiredVelocity.normalize();
        var dist = this.position.distanceTo(position);
        //if (dist > this.arrivalThreshold) {
        desiredVelocity.setLength(this.maxSpeed);
        //} else {
        //    desiredVelocity.setLength(this.maxSpeed * dist / this.arrivalThreshold);
        //}
        desiredVelocity.sub(this.velocity);
        this.steeringForce.add(desiredVelocity);
    },

    avoidance: function(obstacles) {
        var dynamic_length = this.velocity.length() / this.maxSpeed;
        var ahead = this.position.clone().add(this.velocity.clone().normalize().multiplyScalar(dynamic_length));
        var avoidDist = this.position.clone().add(this.velocity.clone().normalize().multiplyScalar(this.avoidDistance*.5));

        console.log(obstacles[0].boundingRadius);
        var mostDangerous = null;
        for (let i=0; i<obstacles.length;i++) {
            let collision = obstacles[i].position.clone().setY(0).distanceTo(ahead) <= obstacles[i].boundingRadius  ||
                            obstacles[i].position.clone().setY(0).distanceTo(avoidDist) <= obstacles[i].boundingRadius;

            if (collision && (mostDangerous==null || this.position.distanceTo(mostDangerous) < this.position.distanceTo(obstacles[i].clone().setY(0)))) {
                mostDangerous = obstacles[i];
            }
        }

        var avoidVector = new THREE.Vector3(0,0,0);
        if (mostDangerous!=null) {
            avoidVector = ahead.clone().sub(mostDangerous.position.clone().setY(0)).normalize().multiplyScalar(1000);
        }
        this.steeringForce.add(avoidVector);
    },

    update: function() {
        this.steeringForce.clampLength(0, this.maxForce);
        this.steeringForce.divideScalar(this.mass);
        this.velocity.add(this.steeringForce);
        this.steeringForce.set(0, 0, 0);
        Entity.prototype.update.call(this);
    }
});
