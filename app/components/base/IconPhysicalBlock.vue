<template>
  <aside id="icon-physical-block"></aside>
</template>

<script setup>
import Matter from "matter-js";

const { data } = await useFetch("/api/icons", {
  key: "icons",
});

const icons = data.value;

/**
 * Generates a random integer between the specified minimum and maximum values.
 *
 * @param {number} min - The minimum value of the range (inclusive).
 * @param {number} max - The maximum value of the range (inclusive).
 * @returns {number} - A random integer between the specified minimum and maximum values.
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

onMounted(() => {
  // create an engine
  const engine = Matter.Engine.create();

  // set gravity
  // engine.gravity.x = 0;
  // engine.gravity.y = 0;

  // create a renderer
  const render = Matter.Render.create({
    element: document.getElementById("icon-physical-block"),
    engine: engine,
    options: {
      width: 600,
      height: 600,
      background: "#1e293b",
      wireframes: false,
      hasBounds: false,
      showAngleIndicator: false,
      showPerformance: false,
    },
  });

  const bodies = [];
  for (const icon of icons) {
    // x, y, width, height
    bodies.push(
      Matter.Bodies.circle(getRandomInt(200, 400), getRandomInt(250, 400), 48, {
        restitution: 0.4,
        render: {
          sprite: {
            texture: icon.path,
          },
        },
      })
    );
  }

  // add all of the bodies to the world
  Matter.Composite.add(engine.world, [
    ...bodies,
    // walls
    // x, y, width, height
    Matter.Bodies.rectangle(300, 0, 600, 1, { isStatic: true }), // top
    Matter.Bodies.rectangle(600, 300, 1, 600, { isStatic: true }), // right
    Matter.Bodies.rectangle(0, 300, 1, 600, { isStatic: true }), // left
    Matter.Bodies.rectangle(300, 600, 600, 1, { isStatic: true }), // bottom
  ]);

  // add mouse control
  const mouse = Matter.Mouse.create(render.canvas),
    mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

  Matter.Composite.add(engine.world, mouseConstraint);

  // keep the mouse in sync with rendering
  render.mouse = mouse;

  // run the renderer
  Matter.Render.run(render);

  // create runner
  const runner = Matter.Runner.create();

  // run the engine
  Matter.Runner.run(runner, engine);
});
</script>
