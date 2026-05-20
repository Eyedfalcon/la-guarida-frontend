using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBarberIdToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BarberId",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_BarberId",
                table: "Users",
                column: "BarberId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Barbers_BarberId",
                table: "Users",
                column: "BarberId",
                principalTable: "Barbers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Barbers_BarberId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_BarberId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BarberId",
                table: "Users");
        }
    }
}
