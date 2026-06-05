import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const port = Number(process.env.PORT || 4000);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  await app.listen(port);
}

void bootstrap();
