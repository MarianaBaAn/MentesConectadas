var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("NuevaPolitica", app =>
    {
        app.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Publica el frontend (HTML, CSS y JavaScript) desde wwwroot.
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("NuevaPolitica");
app.UseAuthorization();

app.MapControllers();

app.Run();
